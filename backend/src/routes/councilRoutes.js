const express = require('express');
const router = express.Router();
const { getPendingDecisions, getCouncilDecisions, getCouncilStats, recordCouncilDecision } = require('../controllers/councilController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorize('council'));

router.get('/pending', getPendingDecisions);
router.get('/decisions', getCouncilDecisions);
router.get('/stats', getCouncilStats);
router.post('/appraisals/:id/decide', recordCouncilDecision);

module.exports = router;
