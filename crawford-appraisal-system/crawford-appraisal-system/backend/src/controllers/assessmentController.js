const { supabase } = require('../config/supabase');

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

// HOD assesses academic staff; Reporting Officer assesses non-teaching staff.
// Dean can assess HODs of any category.
const submitHODAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { hod_grades, hod_recommendation } = req.body;
    if (!hod_grades || !hod_recommendation) {
      return res.status(400).json({ error: 'Grades and recommendation are required.' });
    }

    const { data: appraisal } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(id, department, staff_category, full_name, reporting_officer_id)')
      .eq('id', id).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });

    if (appraisal.staff_id === req.user.id) {
      return res.status(403).json({ error: 'You cannot assess your own appraisal.' });
    }

    const staffCategory = appraisal.users?.staff_category;
    const role = req.user.role;
    const isAcademic = staffCategory === 'academic';

    if (role !== 'dean') {
      if (role === 'reporting_officer') {
        // Reporting Officer can only assess non-teaching staff assigned to them
        if (isAcademic) {
          return res.status(403).json({ error: 'Reporting Officers can only assess non-teaching staff.' });
        }
        if (appraisal.users?.reporting_officer_id !== req.user.id) {
          return res.status(403).json({ error: 'This staff member is not assigned to you.' });
        }
      } else if (['hod', 'hou'].includes(role)) {
        // HOD/HOU can only assess academic staff in their department
        if (!isAcademic) {
          return res.status(403).json({ error: 'HODs can only assess academic staff. Use a Reporting Officer for non-teaching staff.' });
        }
      }
    }

    if (appraisal.status !== 'submitted') {
      return res.status(400).json({ error: 'This appraisal is not ready for assessment.' });
    }

    let nextStatus;
    if (role === 'reporting_officer') {
      nextStatus = 'reporting_officer_assessed';
    } else {
      nextStatus = 'hod_assessed';
    }

    const { data, error } = await supabase.from('appraisals').update({
      hod_id: req.user.id,
      hod_grades,
      hod_recommendation,
      hod_assessed_at: new Date().toISOString(),
      status: nextStatus,
    }).eq('id', id).select().single();
    if (error) throw error;

    if (nextStatus === 'reporting_officer_assessed') {
      // Notify Registry to validate
      const { data: registryUsers } = await supabase.from('users').select('id').eq('role', 'registry');
      if (registryUsers?.length) {
        await supabase.from('notifications').insert(registryUsers.map(r => ({
          user_id: r.id, type: 'hod_assessment_complete',
          title: 'Assessment Pending Registry Validation',
          message: `A Reporting Officer assessment for ${appraisal.users?.full_name} requires your validation.`,
          related_appraisal_id: id,
        })));
      }
    } else {
      // hod_assessed — notify staff directly so they can view and respond
      await notifyUser(appraisal.staff_id, 'hod_assessment_complete', 'Assessment Completed',
        'Your appraisal assessment has been completed by your HOD. You can now view and respond to it.', id);
    }

    const actionLabel = role === 'reporting_officer' ? 'RO_ASSESSMENT_SUBMITTED' : 'HOD_ASSESSMENT_SUBMITTED';
    await logAudit(req.user.id, actionLabel, 'appraisals', id);

    const messages = {
      reporting_officer_assessed: 'Assessment submitted. Sent to Registry for validation.',
      hod_assessed: 'Assessment submitted. Staff has been notified.',
    };
    res.json({ message: messages[nextStatus] || 'Assessment submitted.', appraisal: data });
  } catch (err) {
    console.error('HOD/RO assessment error:', err);
    res.status(500).json({ error: 'Failed to submit assessment.' });
  }
};

const getMyAssessment = async (req, res) => {
  try {
    const { data: appraisal, error } = await supabase.from('appraisals')
      .select('*')
      .eq('staff_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!appraisal) return res.json({ appraisal: null });

    const isAcademic = req.user.staff_category === 'academic';
    const isNonTeaching = !isAcademic;

    // Academic: show grades once HOD has assessed (hod_assessed or later)
    const assessedStatuses = ['hod_assessed', 'staff_viewed', 'dispute_raised', 'dean_resolved', 'college_board_reviewed', 'completed', 'apc_recommended', 'pending_council', 'council_decided'];
    if (isAcademic && !assessedStatuses.includes(appraisal.status)) {
      return res.json({
        appraisal: {
          ...appraisal,
          hod_grades: null,
          hod_recommendation: null,
          _gated: true,
          _gate_reason: 'Pending HOD assessment',
        },
      });
    }

    // Non-teaching: gated by Registry validation
    if (isNonTeaching && !appraisal.registry_validated) {
      return res.json({
        appraisal: {
          ...appraisal,
          hod_grades: null,
          hod_recommendation: null,
          _gated: true,
          _gate_reason: 'Pending Registry validation',
        },
      });
    }

    res.json({ appraisal });
  } catch (err) {
    console.error('Get my assessment error:', err);
    res.status(500).json({ error: 'Failed to fetch assessment.' });
  }
};

const submitDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ error: 'Dispute comment is required.' });

    const { data: appraisal } = await supabase.from('appraisals').select('staff_id, status, users!appraisals_staff_id_fkey(staff_category)').eq('id', id).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (appraisal.staff_id !== req.user.id) return res.status(403).json({ error: 'Not your appraisal.' });

    const { data, error } = await supabase.from('appraisals').update({
      staff_comment: comment,
      staff_action_at: new Date().toISOString(),
      status: 'dispute_raised',
    }).eq('id', id).select().single();
    if (error) throw error;

    // Non-teaching disputes go to Registry; academic disputes go to Dean
    const isAcademic = appraisal.users?.staff_category === 'academic';
    if (isAcademic) {
      const { data: deans } = await supabase.from('users').select('id').eq('role', 'dean');
      if (deans?.length) {
        await supabase.from('notifications').insert(deans.map(d => ({
          user_id: d.id, type: 'dispute_submitted',
          title: 'New Dispute Filed',
          message: 'A staff member has raised a dispute on their academic appraisal assessment.',
          related_appraisal_id: id,
        })));
      }
    } else {
      const { data: registryUsers } = await supabase.from('users').select('id').eq('role', 'registry');
      if (registryUsers?.length) {
        await supabase.from('notifications').insert(registryUsers.map(r => ({
          user_id: r.id, type: 'dispute_submitted',
          title: 'New Dispute Filed',
          message: 'A non-teaching staff member has raised a dispute on their appraisal assessment.',
          related_appraisal_id: id,
        })));
      }
    }

    await logAudit(req.user.id, 'DISPUTE_SUBMITTED', 'appraisals', id);
    res.json({ message: 'Dispute submitted successfully.', appraisal: data });
  } catch (err) {
    console.error('Submit dispute error:', err);
    res.status(500).json({ error: 'Failed to submit dispute.' });
  }
};

const collegeBoardReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!['approved', 'flagged'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or flagged.' });
    }

    const { data: appraisal } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(staff_category, full_name)')
      .eq('id', id).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (appraisal.users?.staff_category !== 'academic') {
      return res.status(400).json({ error: 'Only academic staff appraisals require College Board review.' });
    }
    if (appraisal.status !== 'college_board_reviewing') {
      return res.status(400).json({ error: 'This appraisal is not pending College Board review.' });
    }

    const nextStatus = status === 'approved' ? 'college_board_approved' : 'college_board_reviewing';
    const { data, error } = await supabase.from('appraisals').update({
      college_board_reviewed_by: req.user.id,
      college_board_status: status,
      college_board_notes: notes || null,
      college_board_reviewed_at: new Date().toISOString(),
      status: nextStatus,
    }).eq('id', id).select().single();
    if (error) throw error;

    if (status === 'approved') {
      await notifyUser(appraisal.staff_id, 'college_board_approved', 'Assessment Ready for Review',
        'Your appraisal assessment has been reviewed and is now available for you to view.', id);
    }

    await logAudit(req.user.id, `COLLEGE_BOARD_${status.toUpperCase()}`, 'appraisals', id);
    res.json({
      message: status === 'approved' ? 'Assessment approved. Staff has been notified.' : 'Assessment flagged for further review.',
      appraisal: data,
    });
  } catch (err) {
    console.error('College Board review error:', err);
    res.status(500).json({ error: 'Failed to process College Board review.' });
  }
};

const getPendingCollegeBoardReviews = async (req, res) => {
  try {
    const { data, error } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, department, current_rank)')
      .eq('status', 'college_board_reviewing')
      .eq('college_board_status', 'pending')
      .order('hod_assessed_at', { ascending: true });
    if (error) throw error;
    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get pending CB reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch pending reviews.' });
  }
};

const getApprovedCollegeBoardReviews = async (req, res) => {
  try {
    const { data, error } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, department, current_rank)')
      .eq('college_board_status', 'approved')
      .order('college_board_reviewed_at', { ascending: false });
    if (error) throw error;
    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get approved CB reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch approved reviews.' });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    if (!resolution) return res.status(400).json({ error: 'Resolution comment is required.' });

    const { data: appraisal } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name)')
      .eq('id', id).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (!['disputed', 'dispute_raised'].includes(appraisal.status)) {
      return res.status(400).json({ error: 'This appraisal has no active dispute.' });
    }

    const { data, error } = await supabase.from('appraisals').update({
      dean_id: req.user.id,
      dean_resolution: resolution,
      dean_resolved_at: new Date().toISOString(),
      status: 'dean_resolved',
    }).eq('id', id).select().single();
    if (error) throw error;

    await notifyUser(appraisal.staff_id, 'dispute_resolved', 'Dispute Resolved',
      'The Dean has reviewed and resolved your appraisal dispute.', id);
    await logAudit(req.user.id, 'DISPUTE_RESOLVED', 'appraisals', id);
    res.json({ message: 'Dispute resolved successfully. Staff has been notified.', appraisal: data });
  } catch (err) {
    console.error('Resolve dispute error:', err);
    res.status(500).json({ error: 'Failed to resolve dispute.' });
  }
};

const getPendingDisputes = async (req, res) => {
  try {
    // Dean sees academic disputes; Registry sees non-teaching disputes (handled separately)
    const { data, error } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, department, current_rank, college, staff_category)')
      .in('status', ['disputed', 'dispute_raised'])
      .eq('users.staff_category', 'academic')
      .order('staff_action_at', { ascending: true });
    if (error) throw error;
    res.json({ disputes: data });
  } catch (err) {
    console.error('Get pending disputes error:', err);
    res.status(500).json({ error: 'Failed to fetch disputes.' });
  }
};

const getDeanStats = async (req, res) => {
  try {
    const { data: collegeStaff, error: staffErr } = await supabase
      .from('users').select('id, role')
      .eq('college', req.user.college)
      .neq('id', req.user.id);
    if (staffErr) throw staffErr;

    const staffIds = (collegeStaff || []).map(u => u.id);
    const hodsCount = (collegeStaff || []).filter(u => ['hod', 'hou'].includes(u.role)).length;

    let submittedCount = 0, disputeCount = 0, pendingCBReview = 0;
    if (staffIds.length > 0) {
      const { data: submitted } = await supabase.from('appraisals')
        .select('id').in('staff_id', staffIds).neq('status', 'draft');
      submittedCount = submitted?.length || 0;
      const { data: disputes } = await supabase.from('appraisals')
        .select('id').in('staff_id', staffIds).in('status', ['disputed', 'dispute_raised']);
      disputeCount = disputes?.length || 0;
      const { data: cbPending } = await supabase.from('appraisals')
        .select('id').in('staff_id', staffIds)
        .in('status', ['hod_assessed', 'staff_viewed', 'dispute_raised', 'dean_resolved']);
      pendingCBReview = cbPending?.length || 0;
    }

    res.json({
      total_college_staff: staffIds.length,
      appraisals_submitted: submittedCount,
      active_disputes: disputeCount,
      hods_count: hodsCount,
      pending_college_board_review: pendingCBReview,
    });
  } catch (err) {
    console.error('Get dean stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dean stats.' });
  }
};

const getCollegeOverview = async (req, res) => {
  try {
    const { data: collegeUsers, error: usersErr } = await supabase
      .from('users').select('id, department, role')
      .eq('college', req.user.college)
      .neq('id', req.user.id);
    if (usersErr) throw usersErr;

    const staffIds = (collegeUsers || []).map(u => u.id);
    const hodsCount = (collegeUsers || []).filter(u => ['hod', 'hou'].includes(u.role)).length;

    let appraisals = [];
    if (staffIds.length > 0) {
      const { data } = await supabase
        .from('appraisals').select('id, staff_id, status').in('staff_id', staffIds);
      appraisals = data || [];
    }

    const deptMap = {};
    for (const u of (collegeUsers || [])) {
      const dept = u.department || 'Unknown';
      if (!deptMap[dept]) deptMap[dept] = [];
      deptMap[dept].push(u.id);
    }

    const departments = Object.entries(deptMap).map(([name, ids]) => {
      const deptApps = appraisals.filter(a => ids.includes(a.staff_id));
      const submitted = deptApps.filter(a => a.status !== 'draft').length;
      const disputed = deptApps.filter(a => ['disputed', 'dispute_raised'].includes(a.status)).length;
      return { name, staff: ids.length, submitted, pending: ids.length - submitted, disputed };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const totalSubmitted = appraisals.filter(a => a.status !== 'draft').length;
    const totalDisputed = appraisals.filter(a => ['disputed', 'dispute_raised'].includes(a.status)).length;

    res.json({
      totals: {
        total_staff: staffIds.length,
        submitted: totalSubmitted,
        pending: staffIds.length - totalSubmitted,
        disputed: totalDisputed,
        hods_count: hodsCount,
      },
      departments,
    });
  } catch (err) {
    console.error('College overview error:', err);
    res.status(500).json({ error: 'Failed to fetch college overview.' });
  }
};

// Dean: get all assessed appraisals from their college waiting for College Board review
const getDeanCollegeBoardQueue = async (req, res) => {
  try {
    const reviewableStatuses = ['hod_assessed', 'staff_viewed', 'dispute_raised', 'dean_resolved'];

    const { data: collegeAcademic, error: staffErr } = await supabase.from('users').select('id')
      .eq('college', req.user.college)
      .eq('staff_category', 'academic')
      .neq('id', req.user.id);
    if (staffErr) throw staffErr;

    const staffIds = (collegeAcademic || []).map(u => u.id);
    if (!staffIds.length) return res.json({ appraisals: [] });

    const { data, error } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, department, current_rank, college)')
      .in('staff_id', staffIds)
      .in('status', reviewableStatuses)
      .order('hod_assessed_at', { ascending: true });
    if (error) throw error;
    res.json({ appraisals: data || [] });
  } catch (err) {
    console.error('Dean CB queue error:', err);
    res.status(500).json({ error: 'Failed to fetch college board queue.' });
  }
};

// Dean: submit College Board review with recommendation for A&PC
const deanCollegeBoardReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { recommendation, notes } = req.body;

    const validRecs = ['promote', 'increment', 'both', 'commend', 'no_action'];
    if (!validRecs.includes(recommendation)) {
      return res.status(400).json({ error: 'Recommendation must be: promote, increment, both, commend, or no_action.' });
    }

    const { data: appraisal } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_category, college)')
      .eq('id', id).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (appraisal.users?.staff_category !== 'academic') {
      return res.status(400).json({ error: 'College Board review is only for academic staff.' });
    }

    const reviewable = ['hod_assessed', 'staff_viewed', 'dispute_raised', 'dean_resolved'];
    if (!reviewable.includes(appraisal.status)) {
      return res.status(400).json({ error: 'This appraisal is not ready for College Board review.' });
    }

    const { data, error } = await supabase.from('appraisals').update({
      college_board_recommendation: recommendation,
      college_board_notes: notes || null,
      college_board_reviewed_by: req.user.id,
      college_board_reviewed_at: new Date().toISOString(),
      college_board_status: 'reviewed',
      status: 'college_board_reviewed',
    }).eq('id', id).select().single();
    if (error) throw error;

    // Notify A&PC members
    const { data: apcMembers } = await supabase.from('users').select('id').eq('role', 'a&pc');
    if (apcMembers?.length) {
      const recLabel = { promote: 'Promotion', increment: 'Increment', both: 'Promotion & Increment', commend: 'Commendation', no_action: 'No Action' };
      await supabase.from('notifications').insert(apcMembers.map(m => ({
        user_id: m.id,
        type: 'college_board_reviewed',
        title: 'Appraisal Ready for A&PC Review',
        message: `${appraisal.users?.full_name}'s appraisal has been reviewed by College Board. Recommendation: ${recLabel[recommendation] || recommendation}.`,
        related_appraisal_id: id,
      })));
    }

    await logAudit(req.user.id, 'COLLEGE_BOARD_REVIEW_SUBMITTED', 'appraisals', id);
    res.json({ message: 'College Board review submitted. A&PC has been notified.', appraisal: data });
  } catch (err) {
    console.error('Dean college board review error:', err);
    res.status(500).json({ error: 'Failed to submit College Board review.' });
  }
};

module.exports = {
  submitHODAssessment,
  getMyAssessment,
  submitDispute,
  collegeBoardReview,
  getPendingCollegeBoardReviews,
  getApprovedCollegeBoardReviews,
  resolveDispute,
  getPendingDisputes,
  getDeanStats,
  getCollegeOverview,
  getDeanCollegeBoardQueue,
  deanCollegeBoardReview,
};
