// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register -> inscription
router.post('/register', authController.register);

// POST /api/auth/login -> connexion
router.post('/login', authController.login);

module.exports = router;