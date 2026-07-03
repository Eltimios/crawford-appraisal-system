const { supabase } = require('../config/supabase');

const VALID_DECISIONS = ['approved', 'rejected', 'deferred'];

const DECISION_LABELS = {
  approved:  'Council Approved',
  rejected:  'Council Rejected',
  deferred:  'Deferred to Next Cycle',
};

const STAFF_MESSAGES = {
  approved: 'The University Council has given final approval for the A&PC recommendation on your appraisal.',
  rejected: 'The University Council has reviewed your appraisal and has not approved the A&PC recommendation at this time.',
  deferred: 'The University Council has deferred the review of your appraisal to the next appraisal cycle.',
};

// GET /api/council/pending
const getPendingDecisions = async (req, res) => {
  try {
    const { appraisal_year, q } = req.query;

    let query = supabase
      .from('appraisals')
      .select(`
        *,
        users!appraisals_staff_id_fkey(
          full_name, staff_id, department, college,
          current_rank, staff_category,
          date_of_last_promotion, date_of_first_appointment
        )
      `)
      .eq('status', 'apc_recommended')
      .not('apc_decision', 'is', null)
      .is('council_decision', null);

    if (appraisal_year) query = query.eq('appraisal_year', appraisal_year);

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    let results = data || [];
    if (q) {
      const lower = q.toLowerCase();
      results = results.filter(d =>
        d.users?.full_name?.toLowerCase().includes(lower) ||
        d.users?.staff_id?.toLowerCase().includes(lower)
      );
    }

    res.json({ appraisals: results });
  } catch (err) {
    console.error('Council get pending error:', err);
    res.status(500).json({ error: 'Failed to fetch pending council decisions.' });
  }
};

// GET /api/council/decisions
const getCouncilDecisions = async (req, res) => {
  try {
    const { appraisal_year, decision } = req.query;

    let query = supabase
      .from('appraisals')
      .select(`
        *,
        users!appraisals_staff_id_fkey(
          full_name, staff_id, department, college,
          current_rank, staff_category
        )
      `)
      .not('council_decision', 'is', null);

    if (appraisal_year) query = query.eq('appraisal_year', appraisal_year);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    let results = data || [];
    if (decision) {
      results = results.filter(d => d.council_decision?.decision === decision);
    }

    res.json({ appraisals: results });
  } catch (err) {
    console.error('Council get decisions error:', err);
    res.status(500).json({ error: 'Failed to fetch council decisions.' });
  }
};

// GET /api/council/stats
const getCouncilStats = async (req, res) => {
  try {
    const [pendingRes, decidedRes] = await Promise.all([
      supabase.from('appraisals')
        .select('id, staff_category')
        .eq('status', 'apc_recommended')
        .not('apc_decision', 'is', null)
        .is('council_decision', null),
      supabase.from('appraisals')
        .select('id, staff_category, council_decision')
        .not('council_decision', 'is', null),
    ]);

    const pending = pendingRes.data || [];
    const decided = decidedRes.data || [];

    const pending_academic = pending.filter(d => d.staff_category === 'academic').length;
    const pending_nonteaching = pending.length - pending_academic;

    const approved = decided.filter(d => d.council_decision?.decision === 'approved').length;
    const rejected = decided.filter(d => d.council_decision?.decision === 'rejected').length;
    const deferred = decided.filter(d => d.council_decision?.decision === 'deferred').length;

    const approved_academic = decided.filter(d =>
      d.council_decision?.decision === 'approved' && d.staff_category === 'academic'
    ).length;
    const approved_nonteaching = decided.filter(d =>
      d.council_decision?.decision === 'approved' && d.staff_category !== 'academic'
    ).length;

    res.json({
      pending: pending.length,
      pending_academic,
      pending_nonteaching,
      total_decided: decided.length,
      approved,
      approved_academic,
      approved_nonteaching,
      rejected,
      deferred,
    });
  } catch (err) {
    console.error('Council stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

// POST /api/council/appraisals/:id/decide
const recordCouncilDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body;

    if (!VALID_DECISIONS.includes(decision)) {
      return res.status(400).json({ error: `Decision must be one of: ${VALID_DECISIONS.join(', ')}` });
    }

    const { data: appraisal } = await supabase.from('appraisals')
      .select('id, staff_id, status, apc_decision')
      .eq('id', id).single();

    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (!appraisal.apc_decision) return res.status(400).json({ error: 'This appraisal has no APC recommendation yet.' });
    if (appraisal.status !== 'apc_recommended') {
      return res.status(400).json({ error: 'Appraisal is not pending council decision.' });
    }

    const councilDecision = {
      decision,
      notes: notes || null,
      decided_by: req.user.id,
      decided_by_name: req.user.full_name || req.user.email,
      decided_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('appraisals').update({
      council_decision: councilDecision,
      status: 'council_decided',
    }).eq('id', id).select().single();
    if (error) throw error;

    await supabase.from('notifications').insert({
      user_id: appraisal.staff_id,
      type: 'council_decision',
      title: DECISION_LABELS[decision],
      message: STAFF_MESSAGES[decision],
      related_appraisal_id: id,
    });

    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: `COUNCIL_DECISION_${decision.toUpperCase()}`,
      entity_type: 'appraisals',
      entity_id: id,
    });

    res.json({ message: `Council decision recorded: ${DECISION_LABELS[decision]}.`, appraisal: data });
  } catch (err) {
    console.error('Council decision error:', err);
    res.status(500).json({ error: 'Failed to record council decision.' });
  }
};

module.exports = { getPendingDecisions, getCouncilDecisions, getCouncilStats, recordCouncilDecision };
