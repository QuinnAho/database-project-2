const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { pool, query } = require('../config/db');

const router = express.Router();

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

router.post(
  '/',
  authenticate(['client']),
  [
    body('serviceAddress').trim().notEmpty(),
    body('cleaningType').isIn(['basic', 'deep cleaning', 'move-out', 'other']),
    body('numberOfRooms').isInt({ gt: 0 }),
    body('preferredDate').isISO8601(),
    body('preferredTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
    body('proposedBudget').isFloat({ gt: 0 }),
    body('photos').optional().isArray({ max: 5 })
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return validationError;

    const {
      serviceAddress,
      cleaningType,
      numberOfRooms,
      preferredDate,
      preferredTime,
      proposedBudget,
      specialNotes,
      photos = []
    } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO service_requests 
          (client_id, service_address, cleaning_type, number_of_rooms, preferred_date, preferred_time, proposed_budget, special_notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.userId,
          serviceAddress,
          cleaningType,
          numberOfRooms,
          preferredDate,
          preferredTime,
          proposedBudget,
          specialNotes || null
        ]
      );

      const requestId = result.insertId;
      const photoValues = Array.isArray(photos) ? photos.slice(0, 5) : [];
      if (photoValues.length > 0) {
        await Promise.all(
          photoValues.map((photoUrl, index) =>
            connection.execute(
              `INSERT INTO photos (request_id, photo_url, upload_order) VALUES (?, ?, ?)`,
              [requestId, photoUrl, index + 1]
            )
          )
        );
      }

      await connection.commit();
      return res.status(201).json({ message: 'Service request submitted', requestId });
    } catch (error) {
      await connection.rollback();
      console.error('Failed to create service request', error);
      return res.status(500).json({ message: 'Could not create service request' });
    } finally {
      connection.release();
    }
  }
);

router.get('/', authenticate(['client']), async (req, res) => {
  try {
    const requests = await query(
      `SELECT * FROM service_requests WHERE client_id = ? ORDER BY created_at DESC`,
      [req.user.userId]
    );

    const requestIds = requests.map(r => r.request_id);
    let photosByRequest = {};

    if (requestIds.length > 0) {
      const placeholders = requestIds.map(() => '?').join(',');
      const photos = await query(
        `SELECT request_id, photo_id AS photoId, photo_url AS url, upload_order AS uploadOrder
         FROM photos WHERE request_id IN (${placeholders}) ORDER BY upload_order`,
        requestIds
      );

      photosByRequest = photos.reduce((acc, photo) => {
        if (!acc[photo.request_id]) {
          acc[photo.request_id] = [];
        }
        acc[photo.request_id].push({
          photoId: photo.photoId,
          url: photo.url,
          uploadOrder: photo.uploadOrder
        });
        return acc;
      }, {});
    }

    const response = requests.map(r => ({
      ...r,
      photos: photosByRequest[r.request_id] || []
    }));

    return res.json({ requests: response });
  } catch (error) {
    console.error('Failed to fetch client requests', error);
    return res.status(500).json({ message: 'Failed to load requests' });
  }
});

router.get('/admin', authenticate(['admin']), async (req, res) => {
  const { status } = req.query;

  try {
    let sql = `SELECT sr.*, c.first_name, c.last_name, c.email 
               FROM service_requests sr
               JOIN clients c ON sr.client_id = c.client_id`;
    const params = [];

    if (status) {
      sql += ' WHERE sr.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY sr.created_at DESC';
    const requests = await query(sql, params);
    return res.json({ requests });
  } catch (error) {
    console.error('Failed to load admin requests', error);
    return res.status(500).json({ message: 'Failed to load service requests' });
  }
});

router.get('/:requestId', authenticate(['client', 'admin']), async (req, res) => {
  const { requestId } = req.params;

  try {
    const requests = await query('SELECT * FROM service_requests WHERE request_id = ?', [requestId]);
    if (requests.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = requests[0];
    if (req.user.role === 'client' && request.client_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const photos = await query(
      'SELECT photo_id AS photoId, photo_url AS url, upload_order AS uploadOrder FROM photos WHERE request_id = ? ORDER BY upload_order',
      [requestId]
    );

    return res.json({ request, photos });
  } catch (error) {
    console.error('Failed to load request', error);
    return res.status(500).json({ message: 'Failed to load request' });
  }
});

router.post(
  '/:requestId/reject',
  authenticate(['admin']),
  [body('reason').notEmpty()],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return validationError;

    const { requestId } = req.params;
    const { reason } = req.body;

    try {
      const result = await query('UPDATE service_requests SET status = ?, rejection_reason = ? WHERE request_id = ?', [
        'rejected',
        reason,
        requestId
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Request not found' });
      }

      return res.json({ message: 'Request rejected' });
    } catch (error) {
      console.error('Failed to reject request', error);
      return res.status(500).json({ message: 'Failed to reject request' });
    }
  }
);

module.exports = router;
