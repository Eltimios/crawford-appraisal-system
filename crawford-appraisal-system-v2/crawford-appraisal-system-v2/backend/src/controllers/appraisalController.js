const { supabase } = require('../config/supabase');

// Get all appraisals for logged-in staff member
const getMyAppraisals = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*')
      .eq('staff_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ appraisals: data });
  } catch (error) {
    console.error('Get appraisals error:', error);
    res.status(500).json({ error: 'Failed to fetch appraisals.' });
  }
};

// Get single appraisal by ID
const getAppraisalById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, department, current_rank)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Appraisal not found.' });
    }

    // Access control — staff can only view own appraisals
    // HOD can view departmental staff appraisals
    // Dean, College Board, A&PC can view all
    const allowedRoles = ['hod', 'hou', 'dean', 'college_board', 'apc', 'admin'];
    if (
      data.staff_id !== req.user.id &&
      !allowedRoles.includes(req.user.role)
    ) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Academic staff can only view HOD assessment after College Board approves
    if (
      req.user.id === data.staff_id &&
      req.user.staff_category === 'academic' &&
      data.college_board_status !== 'approved'
    ) {
      // Strip out HOD assessment data until College Board approves
      delete data.hod_grades;
      delete data.hod_recommendation;
    }

    res.json({ appraisal: data });
  } catch (error) {
    console.error('Get appraisal error:', error);
    res.status(500).json({ error: 'Failed to fetch appraisal.' });
  }
};

// Create new appraisal (staff)
const createAppraisal = async (req, res) => {
  try {
    const { appraisal_year } = req.body;

    // Check if appraisal already exists for this year
    const { data: existing } = await supabase
      .from('appraisals')
      .select('id')
      .eq('staff_id', req.user.id)
      .eq('appraisal_year', appraisal_year)
      .single();

    if (existing) {
      return res.status(400).json({
        error: `You already have an appraisal for ${appraisal_year}.`
      });
    }

    const { data, error } = await supabase
      .from('appraisals')
      .insert({
        staff_id: req.user.id,
        appraisal_year,
        staff_category: req.user.staff_category,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await logAudit(req.user.id, 'APPRAISAL_CREATED', 'appraisals', data.id);

    res.status(201).json({
      message: 'Appraisal created successfully.',
      appraisal: data
    });
  } catch (error) {
    console.error('Create appraisal error:', error);
    res.status(500).json({ error: 'Failed to create appraisal.' });
  }
};

// Save/update appraisal Part 1 (personal details — staff)
const updatePart1 = async (req, res) => {
  try {
    const { id } = req.params;
    const { part1_data } = req.body;

    // Fetch appraisal
    const { data: appraisal, error: fetchError } = await supabase
      .from('appraisals')
      .select('*')
      .eq('id', id)
      .eq('staff_id', req.user.id)
      .single();

    if (fetchError || !appraisal) {
      return res.status(404).json({ error: 'Appraisal not found.' });
    }

    // Part 1 is locked after submission
    if (appraisal.part1_locked) {
      return res.status(400).json({
        error: 'Part 1 has been submitted and is now locked.'
      });
    }

    const { data, error } = await supabase
      .from('appraisals')
      .update({ part1_data })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Part 1 saved successfully.', appraisal: data });
  } catch (error) {
    console.error('Update Part 1 error:', error);
    res.status(500).json({ error: 'Failed to save Part 1.' });
  }
};

// Submit appraisal (locks Part 1 and notifies HOD)
const submitAppraisal = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: appraisal } = await supabase
      .from('appraisals')
      .select('*')
      .eq('id', id)
      .eq('staff_id', req.user.id)
      .single();

    if (!appraisal) {
      return res.status(404).json({ error: 'Appraisal not found.' });
    }

    if (appraisal.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft appraisals can be submitted.' });
    }

    if (!appraisal.part1_data) {
      return res.status(400).json({ error: 'Please complete Part 1 before submitting.' });
    }

    // Submit and lock Part 1
    const { data, error } = await supabase
      .from('appraisals')
      .update({
        status: 'submitted',
        part1_locked: true,
        part1_submitted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify HOD
    await notifyHOD(req.user, id);

    // Log audit
    await logAudit(req.user.id, 'APPRAISAL_SUBMITTED', 'appraisals', id);

    res.json({ message: 'Appraisal submitted successfully.', appraisal: data });
  } catch (error) {
    console.error('Submit appraisal error:', error);
    res.status(500).json({ error: 'Failed to submit appraisal.' });
  }
};

// Staff validates or disputes HOD assessment
const respondToAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, counter_comment } = req.body;

    if (!['validated', 'disputed'].includes(action)) {
      return res.status(400).json({ error: 'Action must be validated or disputed.' });
    }

    if (action === 'disputed' && !counter_comment) {
      return res.status(400).json({
        error: 'A counter-comment is required when disputing an assessment.'
      });
    }

    const { data: appraisal } = await supabase
      .from('appraisals')
      .select('*')
      .eq('id', id)
      .eq('staff_id', req.user.id)
      .single();

    if (!appraisal) {
      return res.status(404).json({ error: 'Appraisal not found.' });
    }

    // Check viewing eligibility before allowing response
    const canView =
      (req.user.staff_category !== 'academic' && appraisal.status === 'hod_assessed') ||
      (req.user.staff_category === 'academic' && appraisal.college_board_status === 'approved');

    if (!canView) {
      return res.status(403).json({
        error: 'You cannot respond to the assessment yet.'
      });
    }

    const newStatus = action === 'disputed' ? 'disputed' : 'completed';

    const { data, error } = await supabase
      .from('appraisals')
      .update({
        staff_action: action,
        staff_counter_comment: counter_comment || null,
        staff_action_at: new Date().toISOString(),
        status: newStatus
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If disputed, notify Dean
    if (action === 'disputed') {
      await notifyDean(req.user, id);
    }

    // Log audit
    await logAudit(req.user.id, `APPRAISAL_${action.toUpperCase()}`, 'appraisals', id);

    res.json({
      message: action === 'validated'
        ? 'Assessment validated successfully.'
        : 'Dispute submitted successfully. The Dean will review.',
      appraisal: data
    });
  } catch (error) {
    console.error('Respond to assessment error:', error);
    res.status(500).json({ error: 'Failed to process response.' });
  }
};

// Get all appraisals for HOD's department
const getDepartmentAppraisals = async (req, res) => {
  try {
    const { appraisal_year } = req.query;

    let query = supabase
      .from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, current_rank, staff_category)')
      .eq('users.department', req.user.department);

    if (appraisal_year) {
      query = query.eq('appraisal_year', appraisal_year);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ appraisals: data });
  } catch (error) {
    console.error('Get department appraisals error:', error);
    res.status(500).json({ error: 'Failed to fetch department appraisals.' });
  }
};

// Helper: Notify HOD when staff submits
const notifyHOD = async (staff, appraisalId) => {
  try {
    const { data: hod } = await supabase
      .from('users')
      .select('id')
      .eq('department', staff.department)
      .in('role', ['hod', 'hou'])
      .single();

    if (hod) {
      await supabase.from('notifications').insert({
        user_id: hod.id,
        type: 'appraisal_submitted',
        title: 'New Appraisal Submitted',
        message: `${staff.full_name} has submitted their appraisal and is awaiting your assessment.`,
        related_appraisal_id: appraisalId
      });
    }
  } catch (err) {
    console.error('Notify HOD error:', err);
  }
};

// Helper: Notify Dean of dispute
const notifyDean = async (staff, appraisalId) => {
  try {
    const { data: dean } = await supabase
      .from('users')
      .select('id')
      .eq('college', staff.college)
      .eq('role', 'dean')
      .single();

    if (dean) {
      await supabase.from('notifications').insert({
        user_id: dean.id,
        type: 'dispute_submitted',
        title: 'Appraisal Dispute Submitted',
        message: `${staff.full_name} has disputed their appraisal assessment. Please review and resolve.`,
        related_appraisal_id: appraisalId
      });
    }
  } catch (err) {
    console.error('Notify Dean error:', err);
  }
};

// Helper: Log audit trail
const logAudit = async (userId, action, entityType, entityId) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

module.exports = {
  getMyAppraisals,
  getAppraisalById,
  createAppraisal,
  updatePart1,
  submitAppraisal,
  respondToAssessment,
  getDepartmentAppraisals
};
