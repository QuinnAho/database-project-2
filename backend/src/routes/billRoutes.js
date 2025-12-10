const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { pool, query } = require('../config/db');

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

router.get('/', authenticate(['client']), async (req, res) => {
  try {
    const bills = await query(
      `SELECT b.*, o.order_id, o.status AS order_status 
       FROM bills b 
       JOIN orders o ON b.order_id = o.order_id 
       WHERE b.client_id = ? 
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );
    return res.json({ bills });
  } catch (error) {
    console.error('Failed to load bills', error);
    return res.status(500).json({ message: 'Failed to load bills' });
  }
});

router.get('/admin', authenticate(['admin']), async (req, res) => {
  try {
    const bills = await query(
      `SELECT b.*, c.first_name, c.last_name 
       FROM bills b 
       JOIN clients c ON b.client_id = c.client_id 
       ORDER BY b.created_at DESC`
    );
    return res.json({ bills });
  } catch (error) {
    console.error('Failed to load bills', error);
    return res.status(500).json({ message: 'Failed to load bills' });
  }
});

router.post(
  '/:billId/pay',
  authenticate(['client']),
  [
    body('amountPaid').isFloat({ gt: 0 }),
    body('paymentMethod').isIn(['credit_card', 'debit_card', 'cash', 'other']),
    body('transactionId').optional().isString()
  ],
  async (req, res) => {
    const validationError = validate(req, res);
    if (validationError) return validationError;

    const { billId } = req.params;
    const { amountPaid, paymentMethod, transactionId } = req.body;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [bills] = await connection.execute(
        'SELECT * FROM bills WHERE bill_id = ? FOR UPDATE',
        [billId]
      );

      if (bills.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Bill not found' });
      }

      const bill = bills[0];
      if (bill.client_id !== req.user.userId) {
        await connection.rollback();
        return res.status(403).json({ message: 'Access denied' });
      }

      await connection.execute(
        `INSERT INTO payments 
          (bill_id, client_id, amount_paid, payment_method, transaction_id, payment_status) 
         VALUES (?, ?, ?, ?, ?, 'completed')`,
        [billId, bill.client_id, amountPaid, paymentMethod, transactionId || null]
      );

      await connection.execute('UPDATE bills SET status = ? WHERE bill_id = ?', ['paid', billId]);

      await connection.commit();
      return res.json({ message: 'Payment recorded' });
    } catch (error) {
      await connection.rollback();
      console.error('Failed to record payment', error);
      return res.status(500).json({ message: 'Failed to record payment' });
    } finally {
      connection.release();
    }
  }
);

router.post(
  '/:billId/dispute',
  authenticate(['client']),
  [body('message').notEmpty()],
  async (req, res) => {
    const validationError = validate(req, res);
    if (validationError) return validationError;

    const { billId } = req.params;
    const { message, proposedAmount } = req.body;

    try {
      const bills = await query('SELECT * FROM bills WHERE bill_id = ?', [billId]);
      if (bills.length === 0) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      const bill = bills[0];
      if (bill.client_id !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await query(
        `INSERT INTO bill_negotiations (bill_id, sender_type, message, proposed_amount) 
         VALUES (?, 'client', ?, ?)`,
        [billId, message, proposedAmount || null]
      );

      await query('UPDATE bills SET status = ? WHERE bill_id = ?', ['disputed', billId]);

      return res.json({ message: 'Dispute recorded' });
    } catch (error) {
      console.error('Failed to dispute bill', error);
      return res.status(500).json({ message: 'Failed to dispute bill' });
    }
  }
);

router.post(
  '/:billId/revise',
  authenticate(['admin']),
  [
    body('amount').optional().isFloat({ gt: 0 }),
    body('discount').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['pending', 'paid', 'disputed', 'revised'])
  ],
  async (req, res) => {
    const validationError = validate(req, res);
    if (validationError) return validationError;

    const { billId } = req.params;
    const { amount, discount, status, message, proposedAmount } = req.body;

    try {
      const bills = await query('SELECT * FROM bills WHERE bill_id = ?', [billId]);
      if (bills.length === 0) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      if (message) {
        await query(
          `INSERT INTO bill_negotiations (bill_id, sender_type, message, proposed_amount) 
           VALUES (?, 'contractor', ?, ?)`,
          [billId, message, proposedAmount || null]
        );
      }

      const updates = [];
      const params = [];

      if (amount !== undefined) {
        updates.push('amount = ?');
        params.push(amount);
      }
      if (discount !== undefined) {
        updates.push('discount = ?');
        params.push(discount);
      }
      if (status) {
        updates.push('status = ?');
        params.push(status);
      }

      if (updates.length > 0) {
        params.push(billId);
        await query(`UPDATE bills SET ${updates.join(', ')} WHERE bill_id = ?`, params);
      }

      return res.json({ message: 'Bill updated' });
    } catch (error) {
      console.error('Failed to update bill', error);
      return res.status(500).json({ message: 'Failed to update bill' });
    }
  }
);

module.exports = router;
