const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadMinutes, getMinutes, getMinutesById, getMinutesPdfUrl, generateTemplate } = require('../controllers/minutesController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed.'), false);
  },
});

const UPLOAD_ROLES = ['dean', 'a&pc', 'apc_academic', 'apc_junior', 'apc_senior', 'council'];
const VIEW_ROLES = [...UPLOAD_ROLES, 'hr_personnel', 'admin'];

router.use(authenticate);

router.post('/', authorize(...UPLOAD_ROLES), upload.single('pdf'), uploadMinutes);
router.get('/template/:type', authorize(...VIEW_ROLES), generateTemplate);
router.get('/', authorize(...VIEW_ROLES), getMinutes);
router.get('/:id', authorize(...VIEW_ROLES), getMinutesById);
router.get('/:id/download-url', authorize(...VIEW_ROLES), getMinutesPdfUrl);

module.exports = router;
