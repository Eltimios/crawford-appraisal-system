const express = require('express');
const multer = require('multer');
const router = express.Router();
const { db } = require('../config/db');
const { savePublicFile } = require('../config/storage');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed.'), false);
  },
});

// GET /api/public/assessor/:id
// No authentication — the assessor UUID acts as the access token.
router.get('/assessor/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const assessor = await db('external_assessors')
      .select('id', 'name', 'email', 'institution', 'assessor_type', 'scope', 'stage', 'outcome', 'report_date', 'report_notes', 'report_grades', 'report_file_url', 'report_file_name', 'appraisal_id')
      .where({ id }).first();

    if (!assessor) {
      return res.status(404).json({ error: 'Portal link not found. Please contact the Dean\'s office.' });
    }

    const appraisalRow = await db('appraisals')
      .select(
        'appraisals.id', 'appraisals.appraisal_year',
        'u.id as u_id', 'u.full_name as u_full_name', 'u.staff_id as u_staff_id',
        'u.department as u_department', 'u.college as u_college', 'u.current_rank as u_current_rank'
      )
      .leftJoin('users as u', 'appraisals.staff_id', 'u.id')
      .where('appraisals.id', assessor.appraisal_id).first();

    if (!appraisalRow) {
      return res.status(404).json({ error: 'Candidate data not found.' });
    }

    const staffId = appraisalRow.u_id;

    const publications = await db('publications')
      .select('id', 'title', 'journal_name', 'year_of_publication', 'publisher', 'isbn_issn', 'file_url', 'publication_type')
      .where({ staff_id: staffId })
      .orderBy('year_of_publication', 'desc');

    res.json({
      assessor: {
        id: assessor.id,
        name: assessor.name,
        institution: assessor.institution,
        stage: assessor.stage,
        assessor_type: assessor.assessor_type,
        scope: assessor.scope,
        outcome: assessor.outcome,
        report_date: assessor.report_date,
        report_notes: assessor.report_notes,
        report_grades: assessor.report_grades || null,
        report_file_url: assessor.report_file_url || null,
        report_file_name: assessor.report_file_name || null,
      },
      candidate: {
        full_name: appraisalRow.u_full_name,
        staff_id: appraisalRow.u_staff_id,
        department: appraisalRow.u_department,
        college: appraisalRow.u_college,
        current_rank: appraisalRow.u_current_rank,
        appraisal_year: appraisalRow.appraisal_year,
      },
      publications: publications || [],
    });
  } catch (err) {
    console.error('Public assessor get error:', err);
    res.status(500).json({ error: 'Failed to load portal data.' });
  }
});

// POST /api/public/assessor/:id/submit
// External assessor submits their report — grading plus a required PDF write-up.
router.post('/assessor/:id/submit', upload.single('report_file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome, report_date, report_notes } = req.body;

    let report_grades = null;
    if (req.body.report_grades) {
      try { report_grades = JSON.parse(req.body.report_grades); }
      catch { return res.status(400).json({ error: 'Invalid grades data.' }); }
    }

    if (!['positive', 'negative'].includes(outcome)) {
      return res.status(400).json({ error: 'Outcome must be positive or negative.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'A PDF assessment report document is required.' });
    }

    const assessor = await db('external_assessors').select('id', 'outcome').where({ id }).first();

    if (!assessor) {
      return res.status(404).json({ error: 'Portal link not found.' });
    }

    if (assessor.outcome !== 'pending') {
      return res.status(400).json({ error: 'A report has already been submitted for this assessment.' });
    }

    const relativePath = `${id}/${Date.now()}_${req.file.originalname}`;
    const urlPath = savePublicFile('assessor-reports', relativePath, req.file.buffer);
    const report_file_url = `${req.protocol}://${req.get('host')}${urlPath}`;

    const [data] = await db('external_assessors')
      .where({ id })
      .update({
        outcome,
        report_date: report_date || null,
        report_notes: report_notes || null,
        report_grades: report_grades || null,
        report_file_url,
        report_file_name: req.file.originalname,
      })
      .returning(['id', 'outcome', 'report_date', 'report_notes', 'report_grades', 'report_file_url', 'report_file_name']);

    res.json({
      message: 'Report submitted successfully. Thank you for your assessment.',
      assessor: data,
    });
  } catch (err) {
    console.error('Public assessor submit error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit report.' });
  }
});

module.exports = router;
