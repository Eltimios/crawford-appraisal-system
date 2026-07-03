const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/public/assessor/:id
// No authentication — the assessor UUID acts as the access token.
router.get('/assessor/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: assessor, error: aErr } = await supabase
      .from('external_assessors')
      .select('id, name, email, institution, assessor_type, scope, stage, outcome, report_date, report_notes, report_grades, appraisal_id')
      .eq('id', id)
      .single();

    if (aErr || !assessor) {
      return res.status(404).json({ error: 'Portal link not found. Please contact the Dean\'s office.' });
    }

    const { data: appraisal, error: apErr } = await supabase
      .from('appraisals')
      .select(`
        id, appraisal_year,
        users!appraisals_staff_id_fkey(id, full_name, staff_id, department, college, current_rank)
      `)
      .eq('id', assessor.appraisal_id)
      .single();

    if (apErr || !appraisal) {
      return res.status(404).json({ error: 'Candidate data not found.' });
    }

    const staffId = appraisal.users?.id;

    const { data: publications } = await supabase
      .from('publications')
      .select('id, title, journal_name, year_of_publication, publisher, isbn_issn, file_url, publication_type')
      .eq('staff_id', staffId)
      .order('year_of_publication', { ascending: false });

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
        full_name: appraisal.users?.full_name,
        staff_id: appraisal.users?.staff_id,
        department: appraisal.users?.department,
        college: appraisal.users?.college,
        current_rank: appraisal.users?.current_rank,
        appraisal_year: appraisal.appraisal_year,
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

    const { data: assessor, error: aErr } = await supabase
      .from('external_assessors')
      .select('id, outcome')
      .eq('id', id)
      .single();

    if (aErr || !assessor) {
      return res.status(404).json({ error: 'Portal link not found.' });
    }

    if (assessor.outcome !== 'pending') {
      return res.status(400).json({ error: 'A report has already been submitted for this assessment.' });
    }

    const { data, error } = await supabase
      .from('external_assessors')
      .update({
        outcome,
        report_date: report_date || null,
        report_notes: report_notes || null,
        report_grades: report_grades || null,
      })
      .eq('id', id)
      .select('id, outcome, report_date, report_notes, report_grades')
      .single();

    if (error) throw error;

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
