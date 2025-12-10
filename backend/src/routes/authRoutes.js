const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/db');

const router = express.Router();

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

router.post(
  '/clients/register',
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty(),
    body('address').trim().notEmpty(),
    body('password').isLength({ min: 6 }),
    body('creditCardNumber').isLength({ min: 12 }).withMessage('Credit card number is required'),
    body('creditCardExpiry').matches(/^\d{2}\/\d{4}$/).withMessage('Expiry format MM/YYYY'),
    body('creditCardCvv').isLength({ min: 3, max: 4 })
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return validationError;

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      password,
      creditCardNumber,
      creditCardExpiry,
      creditCardCvv
    } = req.body;

    try {
      const existing = await query('SELECT client_id FROM clients WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        `INSERT INTO clients 
            (first_name, last_name, email, phone, address, credit_card_number, credit_card_expiry, credit_card_cvv, password) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          firstName,
          lastName,
          email,
          phone,
          address,
          creditCardNumber,
          creditCardExpiry,
          creditCardCvv,
          hashedPassword
        ]
      );

      return res.status(201).json({ message: 'Client registered', clientId: result.insertId });
    } catch (error) {
      console.error('Client registration failed', error);
      return res.status(500).json({ message: 'Failed to register client' });
    }
  }
);

router.post(
  '/clients/login',
  [body('email').isEmail(), body('password').notEmpty()],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return validationError;

    const { email, password } = req.body;

    try {
      const clients = await query('SELECT * FROM clients WHERE email = ?', [email]);
      if (clients.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const client = clients[0];
      const passwordMatch = await bcrypt.compare(password, client.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: client.client_id, role: 'client', email: client.email },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      );

      return res.json({
        token,
        client: {
          id: client.client_id,
          firstName: client.first_name,
          lastName: client.last_name,
          email: client.email
        }
      });
    } catch (error) {
      console.error('Client login failed', error);
      return res.status(500).json({ message: 'Login failed' });
    }
  }
);

router.post(
  '/admin/login',
  [body('username').notEmpty(), body('password').notEmpty()],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return validationError;

    const { username, password } = req.body;

    try {
      const admins = await query('SELECT * FROM admin_users WHERE username = ?', [username]);
      if (admins.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const admin = admins[0];
      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: admin.admin_id, role: 'admin', username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      );

      return res.json({
        token,
        admin: {
          id: admin.admin_id,
          username: admin.username,
          fullName: admin.full_name
        }
      });
    } catch (error) {
      console.error('Admin login failed', error);
      return res.status(500).json({ message: 'Login failed' });
    }
  }
);

module.exports = router;
