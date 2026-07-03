const express = require('express');
const router = express.Router();
const { login, logout, getProfile, updatePassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/password', authenticate, updatePassword);

module.exports = router;
