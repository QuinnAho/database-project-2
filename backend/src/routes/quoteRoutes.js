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

router.post(
  '/',
  authenticate(['admin']),
  [
    body('requestId').isInt({ gt: 0 }),
    body('quotedPrice').isFloat({ gt: 0 }),
    body('scheduledDate').isISO8601(),
    body('scheduledStartTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
    body('scheduledEndTime').matches(/^\d{2}:\d{2}(:\d{2})?$/)
  ],
  async (req, res) => {
    const validationError = validate(req, res);
    if (validationError) return validationError;

    const { requestId, quotedPrice, scheduledDate, scheduledStartTime, scheduledEndTime, notes } = req.body;

    try {
      const [request] = await query('SELECT request_id FROM service_requests WHERE request_id = ?', [requestId]);
      if (!request) {
        return res.status(404).json({ message: 'Service request not found' });
      }

      const result = await query(
        `INSERT INTO quotes 
          (request_id, quoted_price, scheduled_date, scheduled_start_time, scheduled_end_time, notes, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [requestId, quotedPrice, scheduledDate, scheduledStartTime, scheduledEndTime, notes || null]
      );

      return res.status(201).json({ message: 'Quote created', quoteId: result.insertId });
    } catch (error) {
      console.error('Failed to create quote', error);
      return res.status(500).json({ message: 'Failed to create quote' });
    }
  }
);

router.get(
  '/request/:requestId',
  authenticate(['client', 'admin']),
  async (req, res) => {
    const { requestId } = req.params;

    try {
      const quotes = await query(
        `SELECT q.*, sr.client_id 
         FROM quotes q 
         JOIN service_requests sr ON q.request_id = sr.request_id
         WHERE q.request_id = ?`,
        [requestId]
      );

      if (quotes.length === 0) {
        return res.json({ quotes: [] });
      }

      if (req.user.role === 'client' && quotes[0].client_id !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const quoteIds = quotes.map(q => q.quote_id);
      const placeholders = quoteIds.map(() => '?').join(',');
      const negotiations = await query(
        `SELECT * FROM quote_negotiations WHERE quote_id IN (${placeholders}) ORDER BY created_at`,
        quoteIds
      );

      const negotiationMap = negotiations.reduce((acc, negotiation) => {
        if (!acc[negotiation.quote_id]) acc[negotiation.quote_id] = [];
        acc[negotiation.quote_id].push(negotiation);
        return acc;
      }, {});

      const response = quotes.map(quote => ({
        ...quote,
        negotiations: negotiationMap[quote.quote_id] || []
      }));

      return res.json({ quotes: response });
    } catch (error) {
      console.error('Failed to load quotes', error);
      return res.status(500).json({ message: 'Failed to load quotes' });
    }
  }
);

router.post(
  '/:quoteId/negotiate',
  authenticate(['client', 'admin']),
  [body('message').notEmpty()],
  async (req, res) => {
    const validationError = validate(req, res);
    if (validationError) return validationError;

    const { quoteId } = req.params;
    const { message, proposedPrice, proposedDate, proposedTime } = req.body;

    try {
      const quotes = await query(
        `SELECT q.quote_id, sr.client_id 
         FROM quotes q 
         JOIN service_requests sr ON q.request_id = sr.request_id 
         WHERE q.quote_id = ?`,
        [quoteId]
      );

      if (quotes.length === 0) {
        return res.status(404).json({ message: 'Quote not found' });
      }

      if (req.user.role === 'client' && quotes[0].client_id !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await query(
        `INSERT INTO quote_negotiations 
          (quote_id, sender_type, message, proposed_price, proposed_date, proposed_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          quoteId,
          req.user.role === 'admin' ? 'contractor' : 'client',
          message,
          proposedPrice || null,
          proposedDate || null,
          proposedTime || null
        ]
      );

      await query('UPDATE quotes SET status = ? WHERE quote_id = ?', ['negotiating', quoteId]);

      return res.json({ message: 'Negotiation added' });
    } catch (error) {
      console.error('Failed to add negotiation', error);
      return res.status(500).json({ message: 'Failed to add negotiation' });
    }
  }
);

router.post('/:quoteId/accept', authenticate(['client']), async (req, res) => {
  const { quoteId } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [quotes] = await connection.execute(
      `SELECT q.*, sr.client_id 
       FROM quotes q 
       JOIN service_requests sr ON q.request_id = sr.request_id 
       WHERE q.quote_id = ? FOR UPDATE`,
      [quoteId]
    );

    if (quotes.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Quote not found' });
    }

    const quote = quotes[0];
    if (quote.client_id !== req.user.userId) {
      await connection.rollback();
      return res.status(403).json({ message: 'Access denied' });
    }

    await connection.execute('UPDATE quotes SET status = ? WHERE quote_id = ?', ['accepted', quoteId]);
    await connection.execute('UPDATE service_requests SET status = ? WHERE request_id = ?', ['accepted', quote.request_id]);

    const [existingOrder] = await connection.execute('SELECT order_id FROM orders WHERE quote_id = ?', [quoteId]);
    let orderId = existingOrder.length > 0 ? existingOrder[0].order_id : null;

    if (!orderId) {
      const [orderResult] = await connection.execute(
        `INSERT INTO orders 
          (quote_id, request_id, client_id, final_price, scheduled_date, scheduled_start_time, scheduled_end_time, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
        [
          quote.quote_id,
          quote.request_id,
          quote.client_id,
          quote.quoted_price,
          quote.scheduled_date,
          quote.scheduled_start_time,
          quote.scheduled_end_time
        ]
      );
      orderId = orderResult.insertId;
    }

    await connection.commit();
    return res.json({ message: 'Quote accepted', orderId });
  } catch (error) {
    await connection.rollback();
    console.error('Failed to accept quote', error);
    return res.status(500).json({ message: 'Failed to accept quote' });
  } finally {
    connection.release();
  }
});

router.post('/:quoteId/reject', authenticate(['client', 'admin']), async (req, res) => {
  const { quoteId } = req.params;
  const isAdmin = req.user.role === 'admin';

  try {
    const quotes = await query(
      `SELECT q.quote_id, sr.client_id 
       FROM quotes q 
       JOIN service_requests sr ON q.request_id = sr.request_id 
       WHERE q.quote_id = ?`,
      [quoteId]
    );

    if (quotes.length === 0) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    if (!isAdmin && quotes[0].client_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await query('UPDATE quotes SET status = ? WHERE quote_id = ?', ['rejected', quoteId]);
    return res.json({ message: 'Quote rejected' });
  } catch (error) {
    console.error('Failed to reject quote', error);
    return res.status(500).json({ message: 'Failed to reject quote' });
  }
});

module.exports = router;
