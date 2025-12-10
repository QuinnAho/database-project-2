const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/db');

const router = express.Router();

router.use(authenticate(['admin']));

router.get('/frequent-clients', async (req, res) => {
  try {
    const clients = await query(
      `SELECT c.client_id, c.first_name, c.last_name, c.email, COUNT(*) AS completed_orders
       FROM clients c
       JOIN orders o ON c.client_id = o.client_id
       WHERE o.status = 'completed'
       GROUP BY c.client_id
       ORDER BY completed_orders DESC
       LIMIT 20`
    );
    return res.json({ clients });
  } catch (error) {
    console.error('Failed to load frequent clients', error);
    return res.status(500).json({ message: 'Failed to load frequent clients' });
  }
});

router.get('/uncommitted-clients', async (req, res) => {
  try {
    const clients = await query(
      `SELECT c.client_id, c.first_name, c.last_name, c.email, COUNT(sr.request_id) AS request_count
       FROM clients c
       JOIN service_requests sr ON c.client_id = sr.client_id
       LEFT JOIN orders o ON sr.request_id = o.request_id AND o.status = 'completed'
       GROUP BY c.client_id
       HAVING COUNT(sr.request_id) >= 3 AND SUM(CASE WHEN o.order_id IS NOT NULL THEN 1 ELSE 0 END) = 0`
    );
    return res.json({ clients });
  } catch (error) {
    console.error('Failed to load uncommitted clients', error);
    return res.status(500).json({ message: 'Failed to load uncommitted clients' });
  }
});

router.get('/accepted-quotes', async (req, res) => {
  const month = parseInt(req.query.month, 10);
  const year = parseInt(req.query.year, 10);

  if (!month || !year) {
    return res.status(400).json({ message: 'month and year query parameters are required' });
  }

  try {
    const quotes = await query(
      `SELECT q.*, c.first_name, c.last_name
       FROM quotes q
       JOIN service_requests sr ON q.request_id = sr.request_id
       JOIN clients c ON sr.client_id = c.client_id
       WHERE q.status = 'accepted' AND MONTH(q.created_at) = ? AND YEAR(q.created_at) = ?
       ORDER BY q.created_at DESC`,
      [month, year]
    );
    return res.json({ quotes });
  } catch (error) {
    console.error('Failed to load accepted quotes', error);
    return res.status(500).json({ message: 'Failed to load accepted quotes' });
  }
});

router.get('/prospective-clients', async (req, res) => {
  try {
    const clients = await query(
      `SELECT c.client_id, c.first_name, c.last_name, c.email, c.created_at
       FROM clients c
       LEFT JOIN service_requests sr ON c.client_id = sr.client_id
       WHERE sr.request_id IS NULL`
    );
    return res.json({ clients });
  } catch (error) {
    console.error('Failed to load prospective clients', error);
    return res.status(500).json({ message: 'Failed to load prospective clients' });
  }
});

router.get('/largest-jobs', async (req, res) => {
  try {
    const jobs = await query(
      `SELECT sr.*, c.first_name, c.last_name
       FROM service_requests sr
       JOIN orders o ON sr.request_id = o.request_id AND o.status = 'completed'
       JOIN clients c ON sr.client_id = c.client_id
       WHERE sr.number_of_rooms = (
         SELECT MAX(sr2.number_of_rooms)
         FROM service_requests sr2
         JOIN orders o2 ON sr2.request_id = o2.request_id AND o2.status = 'completed'
       )`
    );
    return res.json({ jobs });
  } catch (error) {
    console.error('Failed to load largest jobs', error);
    return res.status(500).json({ message: 'Failed to load largest jobs' });
  }
});

router.get('/overdue-bills', async (req, res) => {
  try {
    const bills = await query(
      `SELECT b.*, c.first_name, c.last_name
       FROM bills b
       JOIN clients c ON b.client_id = c.client_id
       WHERE b.status <> 'paid' AND b.due_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
    );
    return res.json({ bills });
  } catch (error) {
    console.error('Failed to load overdue bills', error);
    return res.status(500).json({ message: 'Failed to load overdue bills' });
  }
});

router.get('/bad-clients', async (req, res) => {
  try {
    const clients = await query(
      `SELECT c.client_id, c.first_name, c.last_name, c.email
       FROM clients c
       JOIN bills b ON c.client_id = b.client_id
       LEFT JOIN payments p ON b.bill_id = p.bill_id
       WHERE b.status <> 'paid' AND b.due_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY c.client_id
       HAVING SUM(CASE WHEN p.payment_id IS NOT NULL THEN 1 ELSE 0 END) = 0`
    );
    return res.json({ clients });
  } catch (error) {
    console.error('Failed to load bad clients', error);
    return res.status(500).json({ message: 'Failed to load bad clients' });
  }
});

router.get('/good-clients', async (req, res) => {
  try {
    const clients = await query(
      `WITH first_payments AS (
         SELECT bill_id, MIN(paid_at) AS first_paid_at
         FROM payments
         GROUP BY bill_id
       )
       SELECT c.client_id, c.first_name, c.last_name, c.email
       FROM clients c
       JOIN bills b ON c.client_id = b.client_id
       JOIN first_payments fp ON b.bill_id = fp.bill_id
       GROUP BY c.client_id
       HAVING SUM(CASE WHEN TIMESTAMPDIFF(HOUR, b.created_at, fp.first_paid_at) <= 24 THEN 0 ELSE 1 END) = 0`
    );
    return res.json({ clients });
  } catch (error) {
    console.error('Failed to load good clients', error);
    return res.status(500).json({ message: 'Failed to load good clients' });
  }
});

module.exports = router;
