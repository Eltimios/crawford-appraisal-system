const { supabase } = require('../config/supabase'); // v2

const logAudit = async (userId, action, entityType, entityId) => {
  try {
    await supabase.from('audit_logs').insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId });
  } catch (err) { console.error('Audit log error:', err); }
};

const notifyUser = async (userId, type, title, message, appraisalId) => {
  try {
    await supabase.from('notifications').insert({ user_id: userId, type, title, message, related_appraisal_id: appraisalId });
  } catch (err) { console.error('Notify error:', err); }
};

const getMyAppraisals = async (req, res) => {
  try {
    const { year } = req.query;
    let q = supabase.from('appraisals').select('*').eq('staff_id', req.user.id);
    if (year) q = q.eq('appraisal_year', year);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get appraisals error:', err);
    res.status(500).json({ error: 'Failed to fetch appraisals.' });
  }
};

const getAppraisalById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, department, current_rank, staff_category, college)')
      .eq('id', id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Appraisal not found.' });

    const privileged = ['hod', 'hou', 'dean', 'college_board', 'a&pc', 'admin'];
    if (data.staff_id !== req.user.id && !privileged.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Strip HOD assessment for academic staff until College Board approves
    if (req.user.id === data.staff_id && req.user.staff_category === 'academic' && data.college_board_status !== 'approved') {
      data.hod_grades = null;
      data.hod_recommendation = null;
    }

    res.json({ appraisal: data });
  } catch (err) {
    console.error('Get appraisal error:', err);
    res.status(500).json({ error: 'Failed to fetch appraisal.' });
  }
};

const createAppraisal = async (req, res) => {
  try {
    const { appraisal_year, staff_category: body_category, part1_data } = req.body;

    // maybeSingle() returns null (no error) when 0 rows found, avoids PGRST116
    const { data: existing, error: existingError } = await supabase
      .from('appraisals').select('id, status')
      .eq('staff_id', req.user.id).eq('appraisal_year', appraisal_year).maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return res.status(400).json({
        error: `You already have an appraisal for ${appraisal_year}.`,
        existingId: existing.id,
        existingStatus: existing.status,
      });
    }

    const staff_category = req.user.staff_category || body_category;
    if (!staff_category) return res.status(400).json({ error: 'Staff category is not set. Contact your administrator.' });

    const { data, error } = await supabase.from('appraisals').insert({
      staff_id: req.user.id,
      appraisal_year,
      staff_category,
      status: 'draft',
      part1_data: part1_data || null,
    }).select().single();
    if (error) {
      // Unique constraint violation — another request beat us to it
      if (error.code === '23505') {
        const { data: race } = await supabase.from('appraisals').select('id, status')
          .eq('staff_id', req.user.id).eq('appraisal_year', appraisal_year).maybeSingle();
        return res.status(400).json({
          error: `You already have an appraisal for ${appraisal_year}.`,
          existingId: race?.id,
          existingStatus: race?.status,
        });
      }
      throw error;
    }

    await logAudit(req.user.id, 'APPRAISAL_CREATED', 'appraisals', data.id);
    res.status(201).json({ message: 'Appraisal created successfully.', appraisal: data });
  } catch (err) {
    console.error('Create appraisal error:', err);
    res.status(500).json({ error: 'Failed to create appraisal.', detail: err?.message });
  }
};

const updatePart1 = async (req, res) => {
  try {
    const { id } = req.params;
    const { part1_data } = req.body;

    const { data: appraisal } = await supabase.from('appraisals').select('*').eq('id', id).eq('staff_id', req.user.id).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (appraisal.part1_locked) return res.status(400).json({ error: 'Part 1 has been submitted and is now locked.' });

    const { data, error } = await supabase.from('appraisals').update({ part1_data }).eq('id', id).select().single();
    if (error) throw error;
    res.json({ message: 'Part 1 saved successfully.', appraisal: data });
  } catch (err) {
    console.error('Update Part 1 error:', err);
    res.status(500).json({ error: 'Failed to save Part 1.' });
  }
};

const submitAppraisal = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: appraisal } = await supabase.from('appraisals').select('*').eq('id', id).eq('staff_id', req.user.id).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (appraisal.status !== 'draft') return res.status(400).json({ error: 'Only draft appraisals can be submitted.' });

    const { data, error } = await supabase.from('appraisals').update({
      status: 'submitted',
      part1_locked: true,
      part1_submitted_at: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (error) throw error;

    // Notify HOD (but not if the submitter IS the HOD — their form goes to the Dean)
    const { data: hod } = await supabase.from('users').select('id')
      .eq('department', req.user.department).in('role', ['hod', 'hou'])
      .neq('id', req.user.id).maybeSingle();
    if (hod) {
      await notifyUser(hod.id, 'appraisal_submitted', 'New Appraisal Submitted',
        `${req.user.full_name} has submitted their appraisal and is awaiting your assessment.`, id);
    }

    await logAudit(req.user.id, 'APPRAISAL_SUBMITTED', 'appraisals', id);
    res.json({ message: 'Appraisal submitted successfully.', appraisal: data });
  } catch (err) {
    console.error('Submit appraisal error:', err);
    res.status(500).json({ error: 'Failed to submit appraisal.' });
  }
};

const respondToAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, counter_comment } = req.body;

    if (!['validated', 'disputed'].includes(action)) {
      return res.status(400).json({ error: 'Action must be validated or disputed.' });
    }
    if (action === 'disputed' && !counter_comment) {
      return res.status(400).json({ error: 'A counter-comment is required when disputing.' });
    }

    const { data: appraisal } = await supabase.from('appraisals').select('*').eq('id', id).eq('staff_id', req.user.id).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });

    const respondableStatuses = [
      'hod_assessed',
      'reporting_officer_assessed',
      'registry_validated',
      'college_board_reviewing',
      'college_board_approved',
    ];
    const canView = respondableStatuses.includes(appraisal.status) || !!appraisal.hod_grades;
    if (!canView) return res.status(403).json({ error: 'You cannot respond to the assessment yet.' });

    const newStatus = action === 'disputed' ? 'dispute_raised' : 'staff_viewed';
    const { data, error } = await supabase.from('appraisals').update({
      staff_action: action,
      staff_counter_comment: counter_comment || null,
      staff_action_at: new Date().toISOString(),
      status: newStatus,
    }).eq('id', id).select().single();
    if (error) throw error;

    if (action === 'disputed') {
      const { data: dean } = await supabase.from('users').select('id')
        .eq('college', req.user.college).eq('role', 'dean').single();
      if (dean) {
        await notifyUser(dean.id, 'dispute_submitted', 'Appraisal Dispute Submitted',
          `${req.user.full_name} has disputed their appraisal assessment.`, id);
      }
    }

    await logAudit(req.user.id, `APPRAISAL_${action.toUpperCase()}`, 'appraisals', id);
    res.json({
      message: action === 'validated' ? 'Assessment validated.' : 'Dispute submitted. The Dean will review.',
      appraisal: data
    });
  } catch (err) {
    console.error('Respond to assessment error:', err);
    res.status(500).json({ error: 'Failed to process response.' });
  }
};

const getDepartmentAppraisals = async (req, res) => {
  try {
    const { appraisal_year } = req.query;
    const role = req.user.role;

    let staffIds = [];

    if (role === 'reporting_officer') {
      // Reporting Officer: fetch only staff directly assigned to them
      const { data: assignedStaff, error: assignErr } = await supabase
        .from('users')
        .select('id')
        .eq('reporting_officer_id', req.user.id)
        .in('staff_category', ['junior_nonteaching', 'senior_nonteaching']);
      if (assignErr) throw assignErr;
      staffIds = (assignedStaff || []).map(u => u.id);
    } else {
      // HOD/HOU: fetch academic staff in same department
      const { data: deptStaff, error: staffErr } = await supabase
        .from('users')
        .select('id')
        .eq('department', req.user.department)
        .eq('staff_category', 'academic')
        .neq('id', req.user.id);
      if (staffErr) throw staffErr;
      staffIds = (deptStaff || []).map(u => u.id);
    }

    if (staffIds.length === 0) return res.json({ appraisals: [] });

    let q = supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, current_rank, staff_category, department)')
      .in('staff_id', staffIds)
      .neq('status', 'draft');
    if (appraisal_year) q = q.eq('appraisal_year', appraisal_year);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get department appraisals error:', err);
    res.status(500).json({ error: 'Failed to fetch department appraisals.' });
  }
};

const getHODSubmissions = async (req, res) => {
  try {
    const { appraisal_year } = req.query;

    // Dean sees HOD/HOU appraisals from their own college (excluding self)
    const { data: hods, error: hodErr } = await supabase
      .from('users').select('id')
      .eq('college', req.user.college)
      .in('role', ['hod', 'hou'])
      .neq('id', req.user.id);
    if (hodErr) throw hodErr;

    const hodIds = (hods || []).map(u => u.id);
    if (hodIds.length === 0) return res.json({ appraisals: [] });

    let q = supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, current_rank, department, staff_category)')
      .in('staff_id', hodIds)
      .neq('status', 'draft');
    if (appraisal_year) q = q.eq('appraisal_year', appraisal_year);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get HOD submissions error:', err);
    res.status(500).json({ error: 'Failed to fetch HOD submissions.' });
  }
};

// GET /api/appraisals/dean-submissions — VC sees all Dean appraisals
const getDeanSubmissions = async (req, res) => {
  try {
    const { appraisal_year } = req.query;

    const { data: deans, error: deanErr } = await supabase
      .from('users').select('id')
      .in('role', ['dean'])
      .neq('id', req.user.id);
    if (deanErr) throw deanErr;

    const deanIds = (deans || []).map(u => u.id);
    if (deanIds.length === 0) return res.json({ appraisals: [] });

    let q = supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, current_rank, department, college, staff_category)')
      .in('staff_id', deanIds)
      .neq('status', 'draft');
    if (appraisal_year) q = q.eq('appraisal_year', appraisal_year);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get Dean submissions error:', err);
    res.status(500).json({ error: 'Failed to fetch Dean submissions.' });
  }
};

// PUT /api/appraisals/my/biodata — updates biodata-specific fields even on locked appraisals
const updateBiodata = async (req, res) => {
  try {
    const BIODATA_FIELDS = [
      'phone', 'officeRoomNumber', 'linkedIn', 'orcid', 'scopus',
      'researchgate', 'googleScholar', 'academia', 'visitingHours',
      'researchInterests', 'personalStatement',
    ];
    const patch = {};
    BIODATA_FIELDS.forEach(f => { if (req.body[f] !== undefined) patch[f] = req.body[f]; });

    const { data: appraisal, error: findErr } = await supabase
      .from('appraisals').select('id, part1_data')
      .eq('staff_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle();
    if (findErr) throw findErr;
    if (!appraisal) return res.status(404).json({ error: 'No appraisal found. Please start your appraisal form first.' });

    const merged = { ...(appraisal.part1_data || {}), ...patch };
    const { error } = await supabase.from('appraisals').update({ part1_data: merged }).eq('id', appraisal.id);
    if (error) throw error;

    res.json({ message: 'Biodata updated successfully.' });
  } catch (err) {
    console.error('Biodata update error:', err);
    res.status(500).json({ error: 'Failed to update biodata.' });
  }
};

module.exports = { getMyAppraisals, getAppraisalById, createAppraisal, updatePart1, submitAppraisal, respondToAssessment, getDepartmentAppraisals, getHODSubmissions, getDeanSubmissions, updateBiodata };
