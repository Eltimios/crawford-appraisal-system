const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadPublication, getMyPublications, getStaffPublications,
  getDepartmentPublications, getCollegePublications,
  calculatePublicationPoints, deletePublication,
} = require('../controllers/publicationController');
const { authenticate, authorize, requireCategory } = require('../middleware/authMiddleware');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',                                                      // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/jpeg', 'image/png', 'image/jpg',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype)),
});

router.use(authenticate);

router.get('/my', getMyPublications);
router.post('/', requireCategory('academic'), upload.single('file'), uploadPublication);
router.delete('/:id', requireCategory('academic'), deletePublication);

// HOD views their department's staff publications
router.get('/department', authorize('hod', 'hou'), getDepartmentPublications);

// Dean views their college's staff publications
router.get('/college', authorize('dean'), getCollegePublications);

// Individual staff publications (HOD, Dean, APC, Admin)
router.get('/staff/:staffId', authorize('hod', 'hou', 'dean', 'a&pc', 'apc_academic', 'apc_junior', 'apc_senior', 'admin'), getStaffPublications);
router.get('/staff/:staffId/points', authorize('hod', 'hou', 'dean', 'a&pc', 'apc_academic', 'apc_junior', 'apc_senior', 'admin'), calculatePublicationPoints);

module.exports = router;
