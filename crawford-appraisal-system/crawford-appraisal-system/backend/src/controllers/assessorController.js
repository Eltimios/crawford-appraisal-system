const { supabase } = require('../config/supabase');

const ASSESSOR_RANKS    = ['Lecturer I', 'Senior Lecturer', 'Associate Professor'];
const PROFESSORIAL_RANKS = ['Senior Lecturer', 'Associate Professor'];

// Dean: list appraisals in their college that need external assessors
const getEligibleCandidates = async (req, res) => {
  try {
    const { appraisal_year } = req.query;

    const { data: collegeStaff, error: staffErr } = await supabase
      .from('users')
      .select('id')
      .eq('college', req.user.college)
      .eq('staff_category', 'academic')
      .in('current_rank', ASSESSOR_RANKS);
    if (staffErr) throw staffErr;

    const staffIds = (collegeStaff || []).map(u => u.id);
    if (!staffIds.length) return res.json({ candidates: [] });

    let query = supabase.from('appraisals').select(`
      id, appraisal_year, status, college_board_reviewed_at,
      pfq_established, pfq_established_at, interview_completed,
      users!appraisals_staff_id_fkey(id, full_name, staff_id, department, current_rank, college)
    `).in('staff_id', staffIds).in('status', [
      'college_board_reviewed', 'registry_validated', 'apc_recommended',
      'pending_council', 'council_decided', 'completed',
    ]);

    if (appraisal_year) query = query.eq('appraisal_year', appraisal_year);
    const { data, error } = await query.order('college_board_reviewed_at', { ascending: true });
    if (error) throw error;

    res.json({ candidates: data || [] });
  } catch (err) {
    console.error('Get assessor candidates error:', err);
    res.status(500).json({ error: 'Failed to fetch candidates.' });
  }
};

// Get all assessors for a specific appraisal (Dean / A&PC / VC / Council)
const getAssessors = async (req, res) => {
  try {
    const { appraisalId } = req.params;

    const { data: appraisal, error: apErr } = await supabase.from('appraisals')
      .select(`
        id, pfq_established, pfq_established_at, interview_completed,
        interview_completed_at, interview_notes,
        users!appraisals_staff_id_fkey(full_name, current_rank)
      `)
      .eq('id', appraisalId).single();
    if (apErr || !appraisal) return res.status(404).json({ error: 'Appraisal not found.' });

    const { data: assessors, error } = await supabase.from('external_assessors')
      .select('*')
      .eq('appraisal_id', appraisalId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    res.json({
      assessors: assessors || [],
      appraisal: {
        pfq_established: appraisal.pfq_established,
        pfq_established_at: appraisal.pfq_established_at,
        interview_completed: appraisal.interview_completed,
        interview_completed_at: appraisal.interview_completed_at,
        interview_notes: appraisal.interview_notes,
        current_rank: appraisal.users?.current_rank,
        full_name: appraisal.users?.full_name,
        isProfessorial: PROFESSORIAL_RANKS.includes(appraisal.users?.current_rank),
        needsAssessment: ASSESSOR_RANKS.includes(appraisal.users?.current_rank),
      },
    });
  } catch (err) {
    console.error('Get assessors error:', err);
    res.status(500).json({ error: 'Failed to fetch assessors.' });
  }
};

// Dean: add an assessor to an appraisal
const addAssessor = async (req, res) => {
  try {
    const { appraisalId } = req.params;
    const { name, email, institution, assessor_type, scope, stage } = req.body;

    if (!name || !institution || !assessor_type) {
      return res.status(400).json({ error: 'Name, institution, and assessor type are required.' });
    }
    if (!['internal', 'external'].includes(assessor_type)) {
      return res.status(400).json({ error: 'Assessor type must be internal or external.' });
    }

    const stageVal = stage || 'initial';
    if (!['initial', 'final'].includes(stageVal)) {
      return res.status(400).json({ error: 'Stage must be initial or final.' });
    }

    const { data: appraisal } = await supabase.from('appraisals')
      .select('id, pfq_established, users!appraisals_staff_id_fkey(current_rank)')
      .eq('id', appraisalId).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });

    const rank = appraisal.users?.current_rank;
    if (!ASSESSOR_RANKS.includes(rank)) {
      return res.status(400).json({ error: 'This candidate does not require external assessment.' });
    }

    if (stageVal === 'final') {
      if (!PROFESSORIAL_RANKS.includes(rank)) {
        return res.status(400).json({ error: 'Final stage is only for Senior Lecturer and Associate Professor promotions.' });
      }
      if (!appraisal.pfq_established) {
        return res.status(400).json({ error: 'PFQ must be established by A&PC before adding final stage assessors.' });
      }
      if (assessor_type === 'internal') {
        return res.status(400).json({ error: 'All final stage assessors must be external.' });
      }
      if (!['national', 'international'].includes(scope)) {
        return res.status(400).json({ error: 'Final stage assessors must have scope: national or international.' });
      }
    }

    // Fetch existing assessors for this stage
    const { data: existing } = await supabase.from('external_assessors')
      .select('id, assessor_type, scope')
      .eq('appraisal_id', appraisalId)
      .eq('stage', stageVal);
    const ex = existing || [];

    if (stageVal === 'initial') {
      if (ex.length >= 3) return res.status(400).json({ error: 'Maximum 3 assessors for initial stage.' });
      if (assessor_type === 'external' && ex.filter(a => a.assessor_type === 'external').length >= 1) {
        return res.status(400).json({ error: 'Only 1 external assessor is allowed in the initial stage.' });
      }
      if (assessor_type === 'internal' && ex.filter(a => a.assessor_type === 'internal').length >= 2) {
        return res.status(400).json({ error: 'Only 2 internal assessors are allowed in the initial stage.' });
      }
    }

    if (stageVal === 'final') {
      if (ex.length >= 6) return res.status(400).json({ error: 'Maximum 6 external assessors for final stage (VC selects 3).' });
      if (scope === 'international' && ex.filter(a => a.scope === 'international').length >= 2) {
        return res.status(400).json({ error: 'Maximum 2 international assessors for final stage.' });
      }
      if (scope === 'national' && ex.filter(a => a.scope === 'national').length >= 4) {
        return res.status(400).json({ error: 'Maximum 4 national assessors for final stage.' });
      }
    }

    const { data, error } = await supabase.from('external_assessors').insert({
      appraisal_id: appraisalId,
      stage: stageVal,
      name,
      email: email || null,
      institution,
      assessor_type,
      scope: scope || null,
      assigned_by: req.user.id,
    }).select().single();
    if (error) throw error;

    res.status(201).json({ assessor: data });
  } catch (err) {
    console.error('Add assessor error:', err);
    res.status(500).json({ error: 'Failed to add assessor.' });
  }
};

// Dean: record report outcome for an assessor
const recordOutcome = async (req, res) => {
  try {
    const { assessorId } = req.params;
    const { outcome, report_date, report_notes } = req.body;

    if (!['positive', 'negative', 'pending'].includes(outcome)) {
      return res.status(400).json({ error: 'Outcome must be positive, negative, or pending.' });
    }

    const { data, error } = await supabase.from('external_assessors')
      .update({ outcome, report_date: report_date || null, report_notes: report_notes || null })
      .eq('id', assessorId)
      .select().single();
    if (error || !data) return res.status(404).json({ error: 'Assessor not found.' });

    res.json({ assessor: data });
  } catch (err) {
    console.error('Record outcome error:', err);
    res.status(500).json({ error: 'Failed to record outcome.' });
  }
};

// Dean: remove an assessor (only if no report recorded and not VC-selected)
const deleteAssessor = async (req, res) => {
  try {
    const { assessorId } = req.params;

    const { data: assessor } = await supabase.from('external_assessors')
      .select('id, outcome, selected_by_vc').eq('id', assessorId).single();
    if (!assessor) return res.status(404).json({ error: 'Assessor not found.' });
    if (assessor.outcome !== 'pending') {
      return res.status(400).json({ error: 'Cannot remove an assessor with a recorded report outcome.' });
    }
    if (assessor.selected_by_vc) {
      return res.status(400).json({ error: 'Cannot remove an assessor already selected by the VC.' });
    }

    const { error } = await supabase.from('external_assessors').delete().eq('id', assessorId);
    if (error) throw error;
    res.json({ message: 'Assessor removed.' });
  } catch (err) {
    console.error('Delete assessor error:', err);
    res.status(500).json({ error: 'Failed to remove assessor.' });
  }
};

// A&PC: establish Prima Facie Qualification after 2+ positive initial reports
const establishPFQ = async (req, res) => {
  try {
    const { appraisalId } = req.params;

    const { data: appraisal } = await supabase.from('appraisals')
      .select('id, pfq_established, users!appraisals_staff_id_fkey(current_rank, staff_id, college)')
      .eq('id', appraisalId).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (!PROFESSORIAL_RANKS.includes(appraisal.users?.current_rank)) {
      return res.status(400).json({ error: 'PFQ only applies to Senior Lecturer and Associate Professor promotion candidates.' });
    }
    if (appraisal.pfq_established) {
      return res.status(400).json({ error: 'PFQ has already been established for this candidate.' });
    }

    const { data: positiveInitial } = await supabase.from('external_assessors')
      .select('id').eq('appraisal_id', appraisalId).eq('stage', 'initial').eq('outcome', 'positive');
    if ((positiveInitial || []).length < 2) {
      return res.status(400).json({ error: 'At least 2 positive initial assessor reports are required to establish PFQ.' });
    }

    const { data, error } = await supabase.from('appraisals').update({
      pfq_established: true,
      pfq_established_at: new Date().toISOString(),
      pfq_established_by: req.user.id,
    }).eq('id', appraisalId).select().single();
    if (error) throw error;

    // Notify Dean in candidate's college
    const { data: deans } = await supabase.from('users').select('id')
      .eq('role', 'dean').eq('college', appraisal.users?.college);
    if (deans?.length) {
      await supabase.from('notifications').insert(deans.map(d => ({
        user_id: d.id,
        type: 'pfq_established',
        title: 'Action Required: Submit 6 External Assessor Names',
        message: `PFQ established for staff ID ${appraisal.users?.staff_id}. Please submit 6 external assessor names (2 international + 4 national) to the VC.`,
        related_appraisal_id: appraisalId,
      })));
    }

    res.json({ message: 'PFQ established. Dean notified to submit 6 external assessor names to VC.', appraisal: data });
  } catch (err) {
    console.error('Establish PFQ error:', err);
    res.status(500).json({ error: 'Failed to establish PFQ.' });
  }
};

// VC: list professorial candidates with PFQ established, awaiting assessor selection
const getVCPendingSelection = async (req, res) => {
  try {
    const { appraisal_year } = req.query;

    let query = supabase.from('appraisals').select(`
      id, appraisal_year, pfq_established, pfq_established_at, interview_completed,
      users!appraisals_staff_id_fkey(full_name, staff_id, department, current_rank, college)
    `).eq('pfq_established', true);

    if (appraisal_year) query = query.eq('appraisal_year', appraisal_year);
    const { data, error } = await query.order('pfq_established_at', { ascending: true });
    if (error) throw error;

    const filtered = (data || []).filter(a => PROFESSORIAL_RANKS.includes(a.users?.current_rank));
    res.json({ candidates: filtered });
  } catch (err) {
    console.error('VC pending selection error:', err);
    res.status(500).json({ error: 'Failed to fetch VC pending selection.' });
  }
};

// VC: toggle selection of a final stage external assessor
const vcSelectAssessor = async (req, res) => {
  try {
    const { assessorId } = req.params;
    const { selected } = req.body;

    if (typeof selected !== 'boolean') {
      return res.status(400).json({ error: 'selected must be true or false.' });
    }

    const { data: assessor } = await supabase.from('external_assessors')
      .select('id, appraisal_id, stage, assessor_type, scope')
      .eq('id', assessorId).single();
    if (!assessor) return res.status(404).json({ error: 'Assessor not found.' });
    if (assessor.stage !== 'final')  return res.status(400).json({ error: 'VC can only select final stage assessors.' });
    if (assessor.assessor_type !== 'external') return res.status(400).json({ error: 'VC only selects external assessors.' });

    if (selected) {
      const { data: currentSelected } = await supabase.from('external_assessors')
        .select('id, scope')
        .eq('appraisal_id', assessor.appraisal_id)
        .eq('stage', 'final')
        .eq('selected_by_vc', true)
        .neq('id', assessorId);

      const sel = currentSelected || [];
      if (sel.length >= 3) {
        return res.status(400).json({ error: 'Maximum 3 assessors can be selected (1 international + 2 national).' });
      }
      if (assessor.scope === 'international' && sel.filter(a => a.scope === 'international').length >= 1) {
        return res.status(400).json({ error: 'Only 1 international assessor can be selected.' });
      }
      if (assessor.scope === 'national' && sel.filter(a => a.scope === 'national').length >= 2) {
        return res.status(400).json({ error: 'Only 2 national assessors can be selected.' });
      }
    }

    const { data, error } = await supabase.from('external_assessors').update({
      selected_by_vc: selected,
      vc_selected_by: selected ? req.user.id : null,
      vc_selected_at: selected ? new Date().toISOString() : null,
    }).eq('id', assessorId).select().single();
    if (error) throw error;

    res.json({ assessor: data });
  } catch (err) {
    console.error('VC select assessor error:', err);
    res.status(500).json({ error: 'Failed to update VC selection.' });
  }
};

// A&PC: mark promotion interview as completed
const markInterviewCompleted = async (req, res) => {
  try {
    const { appraisalId } = req.params;
    const { notes } = req.body;

    const { data: appraisal } = await supabase.from('appraisals')
      .select('id, pfq_established, interview_completed, users!appraisals_staff_id_fkey(current_rank)')
      .eq('id', appraisalId).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (!appraisal.pfq_established) {
      return res.status(400).json({ error: 'PFQ must be established before marking interview completed.' });
    }
    if (appraisal.interview_completed) {
      return res.status(400).json({ error: 'Interview has already been marked as completed.' });
    }

    const { data: positiveFinal } = await supabase.from('external_assessors')
      .select('id')
      .eq('appraisal_id', appraisalId)
      .eq('stage', 'final')
      .eq('selected_by_vc', true)
      .eq('outcome', 'positive');
    if ((positiveFinal || []).length < 2) {
      return res.status(400).json({ error: 'At least 2 positive reports from VC-selected assessors are required to mark interview completed.' });
    }

    const { data, error } = await supabase.from('appraisals').update({
      interview_completed: true,
      interview_completed_at: new Date().toISOString(),
      interview_notes: notes || null,
    }).eq('id', appraisalId).select().single();
    if (error) throw error;

    res.json({ message: 'Promotion interview marked as completed.', appraisal: data });
  } catch (err) {
    console.error('Mark interview completed error:', err);
    res.status(500).json({ error: 'Failed to mark interview completed.' });
  }
};

module.exports = {
  getEligibleCandidates,
  getAssessors,
  addAssessor,
  recordOutcome,
  deleteAssessor,
  establishPFQ,
  getVCPendingSelection,
  vcSelectAssessor,
  markInterviewCompleted,
};
