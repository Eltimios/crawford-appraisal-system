const { supabase } = require('../config/supabase');

// HOD/HOU submits assessment for a staff member
const submitHODAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { hod_grades, hod_recommendation } = req.body;

    if (!hod_grades || !hod_recommendation) {
      return res.status(400).json({
        error: 'Grades and recommendation are required.'
      });
    }

    const { data: appraisal } = await supabase
      .from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(department, staff_category, full_name)')
      .eq('id', id)
      .single();

    if (!appraisal) {
      return res.status(404).json({ error: 'Appraisal not found.' });
    }

    if (appraisal.status !== 'submitted') {
      return res.status(400).json({
        error: 'This appraisal is not ready for assessment.'
      });
    }

    // Determine next status based on staff category
    // Academic staff → goes to College Board first
    // Non-Academic staff → goes directly to staff_viewed
    const isAcademic = appraisal.users?.staff_category === 'academic';
    const nextStatus = isAcademic ? 'college_board_reviewing' : 'hod_assessed';

    const { data, error } = await supabase
      .from('appraisals')
      .update({
        hod_id: req.user.id,
        hod_grades,
        hod_recommendation,
        hod_assessed_at: new Date().toISOString(),
        status: nextStatus,
        ...(isAcademic && { college_board_status: 'pending' })
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify accordingly
    if (isAcademic) {
      // Notify College Board
      await notifyCollegeBoard(id, appraisal.users?.full_name);
    } else {
      // Notify staff directly
      await notifyStaff(
        appraisal.staff_id,
        'hod_assessment_complete',
        'Assessment Completed',
        'Your appraisal assessment has been completed. You can now view and respond to it.',
        id
      );
    }

    // Log audit
    await logAudit(req.user.id, 'HOD_ASSESSMENT_SUBMITTED', 'appraisals', id);

    res.json({
      message: isAcademic
        ? 'Assessment submitted. Sent to College Board for review.'
        : 'Assessment submitted. Staff has been notified.',
      appraisal: data
    });
  } catch (error) {
    console.error('HOD assessment error:', error);
    res.status(500).json({ error: 'Failed to submit assessment.' });
  }
};

// College Board reviews academic staff HOD assessment
const collegeBoardReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'flagged'].includes(status)) {
      return res.status(400).json({
        error: 'Status must be approved or flagged.'
      });
    }

    const { data: appraisal } = await supabase
      .from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(staff_category, full_name)')
      .eq('id', id)
      .single();

    if (!appraisal) {
      return res.status(404).json({ error: 'Appraisal not found.' });
    }

    // Only academic staff appraisals go through College Board
    if (appraisal.users?.staff_category !== 'academic') {
      return res.status(400).json({
        error: 'Only academic staff appraisals require College Board review.'
      });
    }

    if (appraisal.status !== 'college_board_reviewing') {
      return res.status(400).json({
        error: 'This appraisal is not pending College Board review.'
      });
    }

    const nextStatus = status === 'approved' ? 'college_board_approved' : 'college_board_reviewing';

    const { data, error } = await supabase
      .from('appraisals')
      .update({
        college_board_reviewed_by: req.user.id,
        college_board_status: status,
        college_board_notes: notes || null,
        college_board_reviewed_at: new Date().toISOString(),
        status: nextStatus
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If approved, notify staff they can now view their assessment
    if (status === 'approved') {
      await notifyStaff(
        appraisal.staff_id,
        'college_board_approved',
        'Assessment Ready for Review',
        'Your appraisal assessment has been reviewed and is now available for you to view.',
        id
      );
    }

    // Log audit
    await logAudit(req.user.id, `COLLEGE_BOARD_${status.toUpperCase()}`, 'appraisals', id);

    res.json({
      message: status === 'approved'
        ? 'Assessment approved. Staff has been notified.'
        : 'Assessment flagged for further review.',
      appraisal: data
    });
  } catch (error) {
    console.error('College Board review error:', error);
    res.status(500).json({ error: 'Failed to process College Board review.' });
  }
};

// Get all appraisals pending College Board review
const getPendingCollegeBoardReviews = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, department, current_rank)')
      .eq('status', 'college_board_reviewing')
      .eq('college_board_status', 'pending')
      .order('hod_assessed_at', { ascending: true });

    if (error) throw error;
    res.json({ appraisals: data });
  } catch (error) {
    console.error('Get pending College Board reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch pending reviews.' });
  }
};

// Dean resolves a dispute
const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({ error: 'Resolution comment is required.' });
    }

    const { data: appraisal } = await supabase
      .from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name)')
      .eq('id', id)
      .single();

    if (!appraisal) {
      return res.status(404).json({ error: 'Appraisal not found.' });
    }

    if (appraisal.status !== 'disputed') {
      return res.status(400).json({
        error: 'This appraisal does not have an active dispute.'
      });
    }

    const { data, error } = await supabase
      .from('appraisals')
      .update({
        dean_id: req.user.id,
        dean_resolution: resolution,
        dean_resolved_at: new Date().toISOString(),
        status: 'dean_resolved'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify staff of resolution
    await notifyStaff(
      appraisal.staff_id,
      'dispute_resolved',
      'Dispute Resolved',
      'The Dean has reviewed and resolved your appraisal dispute. Please log in to view the resolution.',
      id
    );

    // Log audit
    await logAudit(req.user.id, 'DISPUTE_RESOLVED', 'appraisals', id);

    res.json({
      message: 'Dispute resolved successfully. Staff has been notified.',
      appraisal: data
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ error: 'Failed to resolve dispute.' });
  }
};

// Get all disputes pending Dean review
const getPendingDisputes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, department, current_rank)')
      .eq('status', 'disputed')
      .order('staff_action_at', { ascending: true });

    if (error) throw error;
    res.json({ disputes: data });
  } catch (error) {
    console.error('Get pending disputes error:', error);
    res.status(500).json({ error: 'Failed to fetch disputes.' });
  }
};

// Helper: Notify staff
const notifyStaff = async (staffId, type, title, message, appraisalId) => {
  try {
    await supabase.from('notifications').insert({
      user_id: staffId,
      type,
      title,
      message,
      related_appraisal_id: appraisalId
    });
  } catch (err) {
    console.error('Notify staff error:', err);
  }
};

// Helper: Notify College Board
const notifyCollegeBoard = async (appraisalId, staffName) => {
  try {
    const { data: boardMembers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'college_board');

    if (boardMembers?.length) {
      const notifications = boardMembers.map(member => ({
        user_id: member.id,
        type: 'hod_assessment_complete',
        title: 'Assessment Pending Review',
        message: `An HOD assessment for ${staffName} is pending your review before the staff member can view it.`,
        related_appraisal_id: appraisalId
      }));

      await supabase.from('notifications').insert(notifications);
    }
  } catch (err) {
    console.error('Notify College Board error:', err);
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
  submitHODAssessment,
  collegeBoardReview,
  getPendingCollegeBoardReviews,
  resolveDispute,
  getPendingDisputes
};
