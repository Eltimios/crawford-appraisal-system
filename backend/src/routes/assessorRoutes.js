const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getEligibleCandidates,
  getAssessors,
  addAssessor,
  recordOutcome,
  deleteAssessor,
  establishPFQ,
  getVCPendingSelection,
  vcSelectAssessor,
  markInterviewCompleted,
} = require('../controllers/assessorController');

router.use(authenticate);

const APC_ROLES  = ['a&pc', 'apc_academic'];
const VIEW_ROLES = ['dean', 'a&pc', 'apc_academic', 'council', 'vc'];

// Specific named routes BEFORE wildcard /:id routes

router.get('/candidates',           authorize('dean'),       getEligibleCandidates);
router.get('/vc/pending',           authorize('vc'),         getVCPendingSelection);
router.patch('/record/:assessorId', authorize('dean'),       recordOutcome);
router.patch('/vc/select/:assessorId', authorize('vc'),      vcSelectAssessor);

// Wildcard routes
router.get('/:appraisalId',             authorize(...VIEW_ROLES), getAssessors);
router.post('/:appraisalId',            authorize('dean'),        addAssessor);
router.delete('/:assessorId',           authorize('dean'),        deleteAssessor);
router.patch('/:appraisalId/pfq',       authorize(...APC_ROLES),  establishPFQ);
router.patch('/:appraisalId/interview', authorize(...APC_ROLES),  markInterviewCompleted);

module.exports = router;
