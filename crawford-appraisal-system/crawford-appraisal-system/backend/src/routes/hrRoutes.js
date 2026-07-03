const express = require('express');
const router = express.Router();
const {
  getHRStats,
  getTeachingStaff,
  getNonTeachingStaff,
  getStaffAppraisalForPrint,
  exportNominalRoll,
  getRecommendations,
  exportRecommendations,
  onboardStaff,
  updateStaff,
  getReportingOfficers,
} = require('../controllers/hrController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('hr_personnel', 'admin'));

router.get('/stats', getHRStats);
router.get('/teaching-staff', getTeachingStaff);
router.get('/non-teaching-staff', getNonTeachingStaff);
router.get('/staff/:id/appraisal', getStaffAppraisalForPrint);
router.get('/export/excel', exportNominalRoll);
router.get('/recommendations', getRecommendations);
router.get('/export/recommendations', exportRecommendations);
router.post('/onboard-staff', onboardStaff);
router.put('/staff/:id', updateStaff);
router.get('/reporting-officers', getReportingOfficers);

module.exports = router;
