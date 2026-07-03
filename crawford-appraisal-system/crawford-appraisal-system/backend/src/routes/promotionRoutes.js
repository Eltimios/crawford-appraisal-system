const express = require('express');
const router = express.Router();
const { getEligibleAppraisals, getDecidedAppraisals, recordRecommendation, recordDecision } = require('../controllers/promotionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('a&pc', 'apc_academic', 'apc_junior', 'apc_senior', 'registry', 'admin'));

router.get('/eligible', getEligibleAppraisals);
router.get('/decisions', getDecidedAppraisals);
router.post('/appraisals/:id/recommend', recordRecommendation);
router.post('/appraisals/:id/decide', recordDecision); // backwards-compat

module.exports = router;
