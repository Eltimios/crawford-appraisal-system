const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const {
  getAdminStats, getAllUsers, createUser, updateUser, getDeadlines, saveDeadline,
  getAllAppraisals, getAuditLogs, generateOnboardingTemplate, bulkOnboard,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

// ── HR + Admin (staff onboarding) ────────────────────────────────────────────
router.get('/onboarding-template', authorize('admin', 'hr_personnel'), generateOnboardingTemplate);
router.post('/bulk-onboard', authorize('admin', 'hr_personnel'), upload.single('file'), bulkOnboard);
router.get('/users', authorize('admin', 'hr_personnel'), getAllUsers);
router.post('/users', authorize('admin', 'hr_personnel'), createUser);

// ── Admin only ───────────────────────────────────────────────────────────────
router.put('/users/:id',   authorize('admin'), updateUser);
router.get('/stats',       authorize('admin'), getAdminStats);
router.get('/deadlines',   authorize('admin'), getDeadlines);
router.post('/deadlines',  authorize('admin'), saveDeadline);
router.get('/appraisals',  authorize('admin'), getAllAppraisals);
router.get('/audit',       authorize('admin'), getAuditLogs);

module.exports = router;
