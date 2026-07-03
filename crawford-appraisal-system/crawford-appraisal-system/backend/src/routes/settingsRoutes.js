const express = require('express');
const router = express.Router();
const { getCycleStatus, getSettings, updateSettings } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Any authenticated user can check cycle status
router.get('/cycle-status', authenticate, getCycleStatus);

// Admin-only: read and write full settings
router.get('/', authenticate, authorize('admin'), getSettings);
router.put('/', authenticate, authorize('admin'), updateSettings);

module.exports = router;
