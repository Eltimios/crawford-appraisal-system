const express = require('express');
const router = express.Router();
const {
  submitHODAssessment,
  getMyAssessment,
  submitDispute,
  collegeBoardReview,
  getPendingCollegeBoardReviews,
  getApprovedCollegeBoardReviews,
  resolveDispute,
  getPendingDisputes,
  getDeanStats,
  getCollegeOverview,
  getDeanCollegeBoardQueue,
  deanCollegeBoardReview,
} = require('../controllers/assessmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);

// Staff views own assessment (gated by CB/Registry depending on category)
router.get('/my', authorize('staff', 'hod', 'hou', 'reporting_officer', 'dean', 'vc', 'college_board', 'registry', 'hr_personnel', 'a&pc', 'apc_academic', 'apc_junior', 'apc_senior'), getMyAssessment);

// HOD, HOU, Reporting Officer, Dean, and VC all submit assessments
router.post('/:id/assess', authorize('hod', 'hou', 'reporting_officer', 'dean', 'vc'), submitHODAssessment);

// Staff raises a dispute
router.post('/:id/dispute', authorize('staff', 'hod', 'hou', 'reporting_officer', 'dean', 'registry', 'hr_personnel'), submitDispute);

// Dean
router.get('/dean/stats', authorize('dean'), getDeanStats);
router.get('/dean/overview', authorize('dean'), getCollegeOverview);
router.get('/dean/college-board-queue', authorize('dean'), getDeanCollegeBoardQueue);
router.put('/:id/dean-college-board-review', authorize('dean'), deanCollegeBoardReview);
router.get('/disputes/pending', authorize('dean'), getPendingDisputes);
router.put('/:id/resolve-dispute', authorize('dean'), resolveDispute);

// College Board
router.get('/college-board/pending', authorize('college_board'), getPendingCollegeBoardReviews);
router.get('/college-board/approved', authorize('college_board'), getApprovedCollegeBoardReviews);
router.put('/:id/college-board-review', authorize('college_board'), collegeBoardReview);

module.exports = router;
