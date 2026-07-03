const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  submitHODAssessment,
  collegeBoardReview,
  getPendingCollegeBoardReviews,
  resolveDispute,
  getPendingDisputes
} = require('../controllers/assessmentController');

// HOD/HOU routes
router.post('/:id/assess', authenticate, authorize('hod', 'hou'), submitHODAssessment);

// College Board routes
router.get('/college-board/pending', authenticate, authorize('college_board'), getPendingCollegeBoardReviews);
router.put('/:id/college-board-review', authenticate, authorize('college_board'), collegeBoardReview);

// Dean routes
router.get('/disputes/pending', authenticate, authorize('dean', 'admin'), getPendingDisputes);
router.put('/:id/resolve-dispute', authenticate, authorize('dean'), resolveDispute);

module.exports = router;
