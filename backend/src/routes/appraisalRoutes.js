const express = require('express');
const router = express.Router();
const {
  getMyAppraisals, getAppraisalById, createAppraisal,
  updatePart1, submitAppraisal, respondToAssessment, getDepartmentAppraisals, getHODSubmissions, getDeanSubmissions,
  updateBiodata,
} = require('../controllers/appraisalController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/my', getMyAppraisals);
router.get('/department', authorize('hod', 'hou', 'reporting_officer'), getDepartmentAppraisals);
router.get('/hod-submissions', authorize('dean'), getHODSubmissions);
router.get('/dean-submissions', authorize('vc'), getDeanSubmissions);
router.get('/:id', getAppraisalById);
router.post('/', createAppraisal);
router.put('/my/biodata', updateBiodata);
router.put('/:id/part1', updatePart1);
router.post('/:id/submit', submitAppraisal);
router.post('/:id/respond', respondToAssessment);

module.exports = router;
