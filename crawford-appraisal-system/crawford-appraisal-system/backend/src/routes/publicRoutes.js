const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// GET /api/public/assessor/:id
// No authentication — the assessor UUID acts as the access token.
router.get('/assessor/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const assessor = await db('external_assessors')
      .select('id', 'name', 'email', 'institution', 'assessor_type', 'scope', 'stage', 'outcome', 'report_date', 'report_notes', 'report_grades', 'appraisal_id')
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
// External assessor submits their report.
router.post('/assessor/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome, report_date, report_notes, report_grades } = req.body;

    if (!['positive', 'negative'].includes(outcome)) {
      return res.status(400).json({ error: 'Outcome must be positive or negative.' });
    }

    const assessor = await db('external_assessors').select('id', 'outcome').where({ id }).first();

    if (!assessor) {
      return res.status(404).json({ error: 'Portal link not found.' });
    }

    if (assessor.outcome !== 'pending') {
      return res.status(400).json({ error: 'A report has already been submitted for this assessment.' });
    }

    const [data] = await db('external_assessors')
      .where({ id })
      .update({
        outcome,
        report_date: report_date || null,
        report_notes: report_notes || null,
        report_grades: report_grades || null,
      })
      .returning(['id', 'outcome', 'report_date', 'report_notes', 'report_grades']);

    res.json({
      message: 'Report submitted successfully. Thank you for your assessment.',
      assessor: data,
    });
  } catch (err) {
    console.error('Public assessor submit error:', err);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

module.exports = router;
