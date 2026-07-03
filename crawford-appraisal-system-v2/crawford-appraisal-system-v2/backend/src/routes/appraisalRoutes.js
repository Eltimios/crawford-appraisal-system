const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getMyAppraisals,
  getAppraisalById,
  createAppraisal,
  updatePart1,
  submitAppraisal,
  respondToAssessment,
  getDepartmentAppraisals
} = require('../controllers/appraisalController');

// Staff routes
router.get('/my', authenticate, getMyAppraisals);
router.post('/', authenticate, createAppraisal);
router.put('/:id/part1', authenticate, updatePart1);
router.post('/:id/submit', authenticate, submitAppraisal);
router.post('/:id/respond', authenticate, respondToAssessment);

// HOD/HOU routes
router.get('/department', authenticate, authorize('hod', 'hou', 'dean', 'admin'), getDepartmentAppraisals);

// General access — role-specific filtering inside controller
router.get('/:id', authenticate, getAppraisalById);

module.exports = router;
