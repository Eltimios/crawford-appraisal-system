const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/db');

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

const withStaffUser = (query) =>
  query
    .select(
      'appraisals.*',
      'u.full_name as u_full_name', 'u.staff_id as u_staff_id', 'u.department as u_department',
      'u.college as u_college', 'u.current_rank as u_current_rank', 'u.staff_category as u_staff_category',
      'u.date_of_last_promotion as u_date_of_last_promotion', 'u.date_of_first_appointment as u_date_of_first_appointment'
    )
    .leftJoin('users as u', 'appraisals.staff_id', 'u.id');

const reshapeUser = ({ u_full_name, u_staff_id, u_department, u_college, u_current_rank, u_staff_category, u_date_of_last_promotion, u_date_of_first_appointment, ...appraisal }) => ({
  ...appraisal,
  users: {
    full_name: u_full_name, staff_id: u_staff_id, department: u_department, college: u_college,
    current_rank: u_current_rank, staff_category: u_staff_category,
    date_of_last_promotion: u_date_of_last_promotion, date_of_first_appointment: u_date_of_first_appointment,
  },
});

// GET /api/council/pending
const getPendingDecisions = async (req, res) => {
  try {
    const { appraisal_year, q } = req.query;

    let query = withStaffUser(db('appraisals'))
      .where('appraisals.status', 'apc_recommended')
      .whereNotNull('appraisals.apc_decision')
      .whereNull('appraisals.council_decision');

    if (appraisal_year) query = query.andWhere('appraisals.appraisal_year', appraisal_year);

    const rows = await query.orderBy('appraisals.created_at', 'asc');
    let results = rows.map(reshapeUser);

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

    let query = withStaffUser(db('appraisals')).whereNotNull('appraisals.council_decision');

    if (appraisal_year) query = query.andWhere('appraisals.appraisal_year', appraisal_year);

    const rows = await query.orderBy('appraisals.created_at', 'desc');
    let results = rows.map(reshapeUser);

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
    const [pending, decided] = await Promise.all([
      db('appraisals')
        .select('id', 'staff_category')
        .where('status', 'apc_recommended')
        .whereNotNull('apc_decision')
        .whereNull('council_decision'),
      db('appraisals')
        .select('id', 'staff_category', 'council_decision')
        .whereNotNull('council_decision'),
    ]);

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

    const appraisal = await db('appraisals')
      .select('id', 'staff_id', 'status', 'apc_decision')
      .where({ id }).first();

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

    const [data] = await db('appraisals').where({ id }).update({
      council_decision: councilDecision,
      status: 'council_decided',
    }).returning('*');

    await db('notifications').insert({
      id: uuidv4(),
      user_id: appraisal.staff_id,
      type: 'council_decision',
      title: DECISION_LABELS[decision],
      message: STAFF_MESSAGES[decision],
      related_appraisal_id: id,
    });

    await db('audit_logs').insert({
      id: uuidv4(),
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
