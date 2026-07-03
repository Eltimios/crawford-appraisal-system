const express = require('express');
const router = express.Router();
const {
  getRegistryStats,
  getPendingValidation,
  validateAssessment,
  getNonTeachingDisputes,
  resolveNonTeachingDispute,
  getReportingOfficerAppraisals,
  assessReportingOfficer,
  getRegistryOverview,
  getAssessedAppraisals,
  saveRegistryRecommendation,
} = require('../controllers/registryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('registry', 'admin'));

router.get('/stats', getRegistryStats);
router.get('/pending-validation', getPendingValidation);
router.post('/validate/:appraisalId', validateAssessment);
router.get('/disputes', getNonTeachingDisputes);
router.put('/disputes/:appraisalId/resolve', resolveNonTeachingDispute);
router.get('/overview', getRegistryOverview);
router.get('/assessed', getAssessedAppraisals);
router.put('/recommend/:appraisalId', saveRegistryRecommendation);
router.get('/reporting-officers', getReportingOfficerAppraisals);
router.post('/assess-ro/:appraisalId', assessReportingOfficer);

module.exports = router;
