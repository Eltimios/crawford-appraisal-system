// publicationRoutes.js
const express = require('express');
const pubRouter = express.Router();
const multer = require('multer');
const { authenticate, authorize, requireCategory } = require('../middleware/authMiddleware');
const {
  uploadPublication,
  getMyPublications,
  getStaffPublications,
  calculatePublicationPoints,
  deletePublication
} = require('../controllers/publicationController');

// Multer config — store in memory for Supabase upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, PNG files are allowed.'));
    }
  }
});

// Academic staff only routes
pubRouter.get('/my', authenticate, requireCategory('academic'), getMyPublications);
pubRouter.post('/', authenticate, requireCategory('academic'), upload.single('file'), uploadPublication);
pubRouter.delete('/:id', authenticate, requireCategory('academic'), deletePublication);

// A&PC and admin routes
pubRouter.get('/staff/:staffId', authenticate, authorize('apc', 'admin', 'dean'), getStaffPublications);
pubRouter.get('/staff/:staffId/points', authenticate, authorize('apc', 'admin'), calculatePublicationPoints);

module.exports = pubRouter;

// ============================================================

// promotionRoutes.js
const promRouter = express.Router();
const {
  getEligibleStaff,
  checkEligibility,
  recordDecision,
  getPromotionHistory
} = require('../controllers/promotionController');

// A&PC routes
promRouter.get('/eligible', authenticate, authorize('apc', 'admin'), getEligibleStaff);
promRouter.post('/staff/:staffId/decide', authenticate, authorize('apc'), recordDecision);

// General routes
promRouter.get('/staff/:staffId/eligibility', authenticate, authorize('apc', 'admin', 'dean'), checkEligibility);
promRouter.get('/staff/:staffId/history', authenticate, getPromotionHistory);
promRouter.get('/my/history', authenticate, (req, res, next) => {
  req.params.staffId = req.user.id;
  next();
}, getPromotionHistory);

module.exports = { pubRouter, promRouter };
