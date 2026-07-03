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

// GET /api/registry/stats
const getRegistryStats = async (req, res) => {
  try {
    const [
      { data: pendingValidation },
      { data: pendingDisputes },
      { data: validated },
    ] = await Promise.all([
      supabase.from('appraisals')
        .select('id, users!appraisals_staff_id_fkey(staff_category)')
        .eq('status', 'reporting_officer_assessed'),
      supabase.from('appraisals')
        .select('id, users!appraisals_staff_id_fkey(staff_category)')
        .eq('status', 'dispute_raised'),
      supabase.from('appraisals')
        .select('id')
        .eq('registry_validated', true),
    ]);

    // Filter to non-teaching only
    const pendingCount = (pendingValidation || []).filter(a => a.users?.staff_category !== 'academic').length;
    const disputeCount = (pendingDisputes || []).filter(a => a.users?.staff_category !== 'academic').length;
    const validatedCount = validated?.length || 0;

    res.json({
      pending_validation: pendingCount,
      pending_disputes: disputeCount,
      validated_this_cycle: validatedCount,
    });
  } catch (err) {
    console.error('Registry stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

// GET /api/registry/pending-validation
const getPendingValidation = async (req, res) => {
  try {
    const { data, error } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, department, staff_category, current_rank)')
      .eq('status', 'reporting_officer_assessed')
      .eq('registry_validated', false)
      .order('hod_assessed_at', { ascending: true });
    if (error) throw error;

    // Registry only validates non-teaching staff
    const filtered = (data || []).filter(a => a.users?.staff_category !== 'academic');
    res.json({ appraisals: filtered });
  } catch (err) {
    console.error('Get pending validation error:', err);
    res.status(500).json({ error: 'Failed to fetch pending validations.' });
  }
};

// POST /api/registry/validate/:appraisalId
const validateAssessment = async (req, res) => {
  try {
    const { appraisalId } = req.params;
    const { remarks, registry_summary, registry_recommended_action } = req.body;

    if (!registry_summary) {
      return res.status(400).json({ error: 'Registry summary assessment is required.' });
    }

    const { data: appraisal } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_category)')
      .eq('id', appraisalId).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });

    if (appraisal.users?.staff_category === 'academic') {
      return res.status(400).json({ error: 'Registry only validates non-teaching staff appraisals.' });
    }
    if (appraisal.status !== 'reporting_officer_assessed') {
      return res.status(400).json({ error: 'This appraisal is not pending Registry validation.' });
    }

    const { data, error } = await supabase.from('appraisals').update({
      registry_validated: true,
      registry_validated_by: req.user.id,
      registry_validated_at: new Date().toISOString(),
      registry_remarks: remarks || null,
      registry_summary,
      registry_recommended_action: registry_recommended_action || null,
      status: 'registry_validated',
    }).eq('id', appraisalId).select().single();
    if (error) throw error;

    await notifyUser(appraisal.staff_id, 'hod_assessment_complete', 'Assessment Ready for Review',
      'Your appraisal assessment has been validated and is now available for you to view.', appraisalId);

    await logAudit(req.user.id, 'REGISTRY_VALIDATED', 'appraisals', appraisalId);
    res.json({ message: 'Assessment validated. Staff has been notified.', appraisal: data });
  } catch (err) {
    console.error('Validate assessment error:', err);
    res.status(500).json({ error: 'Failed to validate assessment.' });
  }
};

// GET /api/registry/disputes
const getNonTeachingDisputes = async (req, res) => {
  try {
    const { data, error } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, department, staff_category, current_rank)')
      .in('status', ['dispute_raised', 'disputed'])
      .order('staff_action_at', { ascending: true });
    if (error) throw error;

    const filtered = (data || []).filter(a => a.users?.staff_category !== 'academic');
    res.json({ disputes: filtered });
  } catch (err) {
    console.error('Get non-teaching disputes error:', err);
    res.status(500).json({ error: 'Failed to fetch disputes.' });
  }
};

// PUT /api/registry/disputes/:appraisalId/resolve
const resolveNonTeachingDispute = async (req, res) => {
  try {
    const { appraisalId } = req.params;
    const { resolution } = req.body;
    if (!resolution) return res.status(400).json({ error: 'Resolution comment is required.' });

    const { data: appraisal } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_category)')
      .eq('id', appraisalId).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });

    if (appraisal.users?.staff_category === 'academic') {
      return res.status(400).json({ error: 'Academic staff disputes are resolved by the Dean.' });
    }
    if (!['dispute_raised', 'disputed'].includes(appraisal.status)) {
      return res.status(400).json({ error: 'No active dispute on this appraisal.' });
    }

    const { data, error } = await supabase.from('appraisals').update({
      dean_id: req.user.id,
      dean_resolution: resolution,
      dean_resolved_at: new Date().toISOString(),
      status: 'dean_resolved',
    }).eq('id', appraisalId).select().single();
    if (error) throw error;

    await notifyUser(appraisal.staff_id, 'dispute_resolved', 'Dispute Resolved',
      'Registry has reviewed and resolved your appraisal dispute.', appraisalId);
    await logAudit(req.user.id, 'REGISTRY_DISPUTE_RESOLVED', 'appraisals', appraisalId);
    res.json({ message: 'Dispute resolved. Staff has been notified.', appraisal: data });
  } catch (err) {
    console.error('Registry resolve dispute error:', err);
    res.status(500).json({ error: 'Failed to resolve dispute.' });
  }
};

// GET /api/registry/reporting-officers — list RO appraisals for Registry to assess
const getReportingOfficerAppraisals = async (req, res) => {
  try {
    const { year } = req.query;
    let query = supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(id, full_name, staff_id, department, current_rank, role)')
      .eq('users.role', 'reporting_officer')
      .order('created_at', { ascending: false });
    if (year) query = query.eq('appraisal_year', year);
    const { data, error } = await query;
    if (error) throw error;
    const filtered = (data || []).filter(a => a.users?.role === 'reporting_officer');
    res.json({ appraisals: filtered });
  } catch (err) {
    console.error('Get RO appraisals error:', err);
    res.status(500).json({ error: 'Failed to fetch Reporting Officer appraisals.' });
  }
};

// POST /api/registry/assess-ro/:appraisalId — Registry assesses a Reporting Officer
const assessReportingOfficer = async (req, res) => {
  try {
    const { appraisalId } = req.params;
    const { grades, overallGrade, recommendation } = req.body;
    if (!overallGrade || !recommendation) {
      return res.status(400).json({ error: 'Overall grade and recommendation are required.' });
    }

    const { data: appraisal } = await supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, role)')
      .eq('id', appraisalId).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (appraisal.users?.role !== 'reporting_officer') {
      return res.status(400).json({ error: 'This appraisal does not belong to a Reporting Officer.' });
    }

    const assessment = { grades, overallGrade, recommendation, assessedAt: new Date().toISOString() };

    const { data, error } = await supabase.from('appraisals').update({
      hod_grades: assessment,
      hod_recommendation: recommendation,
      hod_assessed_at: new Date().toISOString(),
      hod_id: req.user.id,
      status: 'registry_assessed',
    }).eq('id', appraisalId).select().single();
    if (error) throw error;

    await notifyUser(appraisal.staff_id, 'hod_assessment_complete', 'Your Appraisal Has Been Assessed',
      'Registry has completed your appraisal assessment.', appraisalId);
    await logAudit(req.user.id, 'REGISTRY_RO_ASSESSED', 'appraisals', appraisalId);
    res.json({ message: 'Reporting Officer assessed successfully.', appraisal: data });
  } catch (err) {
    console.error('Registry assess RO error:', err);
    res.status(500).json({ error: 'Failed to submit assessment.' });
  }
};

// GET /api/registry/assessed — all non-teaching appraisals that have been RO-assessed
const getAssessedAppraisals = async (req, res) => {
  try {
    const { year } = req.query;
    const assessedStatuses = [
      'reporting_officer_assessed', 'registry_validated',
      'staff_viewed', 'dispute_raised', 'disputed', 'dean_resolved', 'completed',
    ];
    let q = supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, department, staff_category, current_rank)')
      .in('status', assessedStatuses);
    if (year) q = q.eq('appraisal_year', year);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    const filtered = (data || []).filter(a => a.users?.staff_category !== 'academic');
    res.json({ appraisals: filtered });
  } catch (err) {
    console.error('Get assessed appraisals error:', err);
    res.status(500).json({ error: 'Failed to fetch assessed appraisals.' });
  }
};

// PUT /api/registry/recommend/:appraisalId — save/update Registry recommendation at any time
const saveRegistryRecommendation = async (req, res) => {
  try {
    const { appraisalId } = req.params;
    const { registry_summary, registry_recommended_action, registry_remarks } = req.body;
    if (!registry_summary) return res.status(400).json({ error: 'Summary of assessment is required.' });

    const { data: appraisal } = await supabase.from('appraisals')
      .select('id, status, users!appraisals_staff_id_fkey(staff_category)')
      .eq('id', appraisalId).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (appraisal.users?.staff_category === 'academic') {
      return res.status(400).json({ error: 'Registry only recommends for non-teaching staff.' });
    }

    const { data, error } = await supabase.from('appraisals').update({
      registry_summary,
      registry_recommended_action: registry_recommended_action || null,
      registry_remarks: registry_remarks || null,
    }).eq('id', appraisalId).select().single();
    if (error) throw error;

    await logAudit(req.user.id, 'REGISTRY_RECOMMENDATION_SAVED', 'appraisals', appraisalId);
    res.json({ message: 'Recommendation saved successfully.', appraisal: data });
  } catch (err) {
    console.error('Save registry recommendation error:', err);
    res.status(500).json({ error: 'Failed to save recommendation.' });
  }
};

// GET /api/registry/overview
const getRegistryOverview = async (req, res) => {
  try {
    const { year } = req.query;

    // All active non-teaching staff
    const { data: staffList } = await supabase.from('users')
      .select('id, full_name, staff_id, department, staff_category, current_rank, is_active')
      .in('staff_category', ['junior_nonteaching', 'senior_nonteaching'])
      .eq('is_active', true);

    const staffIds = (staffList || []).map(s => s.id);
    if (staffIds.length === 0) return res.json({ totals: {}, departments: [], appraisals: [] });

    let q = supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, department, staff_category, current_rank)')
      .in('staff_id', staffIds);
    if (year) q = q.eq('appraisal_year', year);
    const { data: appraisals, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;

    const list = appraisals || [];
    const totalStaff = staffList.length;
    const submitted = list.filter(a => a.status !== 'draft').length;
    const assessed  = list.filter(a => ['reporting_officer_assessed','registry_validated','staff_viewed','dispute_raised','disputed','dean_resolved','completed'].includes(a.status)).length;
    const validated = list.filter(a => a.registry_validated).length;
    const disputes  = list.filter(a => ['dispute_raised','disputed'].includes(a.status)).length;

    // Department breakdown — seed from staff list so depts with 0 submissions still appear
    const deptMap = {};
    (staffList || []).forEach(s => {
      const d = s.department || 'Unknown';
      if (!deptMap[d]) deptMap[d] = { name: d, staff: 0, submitted: 0, assessed: 0, validated: 0, disputed: 0 };
      deptMap[d].staff += 1;
    });
    list.forEach(a => {
      const d = a.users?.department || 'Unknown';
      if (!deptMap[d]) deptMap[d] = { name: d, staff: 0, submitted: 0, assessed: 0, validated: 0, disputed: 0 };
      if (a.status !== 'draft') deptMap[d].submitted += 1;
      if (['reporting_officer_assessed','registry_validated','staff_viewed','dispute_raised','disputed','dean_resolved','completed'].includes(a.status)) deptMap[d].assessed += 1;
      if (a.registry_validated) deptMap[d].validated += 1;
      if (['dispute_raised','disputed'].includes(a.status)) deptMap[d].disputed += 1;
    });

    res.json({
      totals: { total_staff: totalStaff, submitted, pending: Math.max(0, totalStaff - submitted), assessed, validated, disputes },
      departments: Object.values(deptMap).sort((a, b) => a.name.localeCompare(b.name)),
      appraisals: list,
    });
  } catch (err) {
    console.error('Registry overview error:', err);
    res.status(500).json({ error: 'Failed to fetch registry overview.' });
  }
};

module.exports = {
  getRegistryStats,
  getPendingValidation,
  validateAssessment,
  getNonTeachingDisputes,
  resolveNonTeachingDispute,
  getReportingOfficerAppraisals,
  assessReportingOfficer,
  getRegistryOverview,
  getAssessedAppraisals,
  saveRegistryRecommendation,
};
