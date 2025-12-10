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
    const orders = await query(
      `SELECT o.*, b.bill_id, b.status AS bill_status 
       FROM orders o 
       LEFT JOIN bills b ON o.order_id = b.order_id 
       WHERE o.client_id = ? 
       ORDER BY o.created_at DESC`,
      [req.user.userId]
    );
    return res.json({ orders });
  } catch (error) {
    console.error('Failed to load client orders', error);
    return res.status(500).json({ message: 'Failed to load orders' });
  }
});

router.get('/admin', authenticate(['admin']), async (req, res) => {
  try {
    const orders = await query(
      `SELECT o.*, c.first_name, c.last_name 
       FROM orders o 
       JOIN clients c ON o.client_id = c.client_id 
       ORDER BY o.created_at DESC`
    );
    return res.json({ orders });
  } catch (error) {
    console.error('Failed to load admin orders', error);
    return res.status(500).json({ message: 'Failed to load orders' });
  }
});

router.post(
  '/:orderId/complete',
  authenticate(['admin']),
  [body('amount').isFloat({ gt: 0 }), body('dueDate').isISO8601(), body('discount').optional().isFloat({ min: 0 })],
  async (req, res) => {
    const validationError = validate(req, res);
    if (validationError) return validationError;

    const { orderId } = req.params;
    const { amount, discount = 0, notes, dueDate } = req.body;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [orders] = await connection.execute('SELECT * FROM orders WHERE order_id = ? FOR UPDATE', [orderId]);
      if (orders.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Order not found' });
      }

      const order = orders[0];

      await connection.execute(
        `UPDATE orders 
         SET status = 'completed', completion_notes = ?, completed_at = NOW() 
         WHERE order_id = ?`,
        [notes || null, orderId]
      );

      const [existingBills] = await connection.execute('SELECT bill_id FROM bills WHERE order_id = ?', [orderId]);
      let billId = existingBills.length ? existingBills[0].bill_id : null;

      if (billId) {
        await connection.execute(
          `UPDATE bills 
           SET amount = ?, discount = ?, status = 'pending', due_date = ?, notes = ?, updated_at = NOW() 
           WHERE bill_id = ?`,
          [amount, discount, dueDate, notes || null, billId]
        );
      } else {
        const [billResult] = await connection.execute(
          `INSERT INTO bills (order_id, client_id, amount, discount, status, due_date, notes) 
           VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
          [orderId, order.client_id, amount, discount, dueDate, notes || null]
        );
        billId = billResult.insertId;
      }

      await connection.commit();
      return res.json({ message: 'Order completed and bill generated', billId });
    } catch (error) {
      await connection.rollback();
      console.error('Failed to complete order', error);
      return res.status(500).json({ message: 'Failed to complete order' });
    } finally {
      connection.release();
    }
  }
);

module.exports = router;
