const express = require('express');
const router = express.Router();
const { login, logout, getProfile, updateProfile, updatePassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/reset-password', resetPassword);

router.use(authenticate);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

module.exports = router;
