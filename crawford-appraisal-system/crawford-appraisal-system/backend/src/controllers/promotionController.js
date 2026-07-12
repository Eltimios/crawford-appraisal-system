const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/db');

const ELIGIBLE_STATUSES = [
  'hod_assessed', 'reporting_officer_assessed',
  'college_board_approved', 'college_board_reviewed', 'registry_validated',
  'staff_viewed', 'dispute_raised', 'dean_resolved', 'completed',
  'apc_recommended', 'pending_council',
];

// Role → forced category/type so split APC portals can't cross-view data
const ROLE_CATEGORY_LOCK = {
  apc_academic: { category: 'teaching',     type: null },
  apc_junior:   { category: 'non-teaching', type: 'junior' },
  apc_senior:   { category: 'non-teaching', type: 'senior' },
};

// Shared join for appraisals + their staff user — replicates the
// `users!appraisals_staff_id_fkey(...)` embed.
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

// GET /api/promotions/eligible
const getEligibleAppraisals = async (req, res) => {
  try {
    let { appraisal_year, category, type, q } = req.query;
    // category: 'teaching' | 'non-teaching'
    // type: 'junior' | 'senior' (only when category = non-teaching)

    // Enforce category scope by role — split APC users cannot see other categories
    const lock = ROLE_CATEGORY_LOCK[req.user?.role];
    if (lock) { category = lock.category; type = lock.type; }

    let query = withStaffUser(db('appraisals'))
      .whereIn('appraisals.status', ELIGIBLE_STATUSES)
      .whereNull('appraisals.apc_decision');

    if (appraisal_year) query = query.andWhere('appraisals.appraisal_year', appraisal_year);

    const rows = await query.orderBy('appraisals.hod_assessed_at', 'asc');
    let filtered = rows.map(reshapeUser);

    // Category filter
    if (category === 'teaching') {
      filtered = filtered.filter(d => d.users?.staff_category === 'academic');
    } else if (category === 'non-teaching') {
      filtered = filtered.filter(d => d.users?.staff_category !== 'academic');
      if (type === 'junior') {
        filtered = filtered.filter(d => d.users?.staff_category === 'junior_nonteaching');
      } else if (type === 'senior') {
        filtered = filtered.filter(d => d.users?.staff_category === 'senior_nonteaching');
      }
    }

    // Search filter
    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(d =>
        d.users?.full_name?.toLowerCase().includes(lower) ||
        d.users?.staff_id?.toLowerCase().includes(lower)
      );
    }

    res.json({ appraisals: filtered });
  } catch (err) {
    console.error('Get eligible appraisals error:', err);
    res.status(500).json({ error: 'Failed to fetch eligible appraisals.' });
  }
};

// GET /api/promotions/decisions
const getDecidedAppraisals = async (req, res) => {
  try {
    let { appraisal_year, recommendation, category, type } = req.query;

    const lock = ROLE_CATEGORY_LOCK[req.user?.role];
    if (lock) { category = lock.category; type = lock.type; }

    let query = withStaffUser(db('appraisals')).whereNotNull('appraisals.apc_decision');

    if (appraisal_year) query = query.andWhere('appraisals.appraisal_year', appraisal_year);

    const rows = await query.orderBy('appraisals.created_at', 'desc');
    let filtered = rows.map(reshapeUser);

    if (recommendation) {
      filtered = filtered.filter(d => d.apc_decision?.decision === recommendation);
    }
    if (category === 'teaching') {
      filtered = filtered.filter(d => d.users?.staff_category === 'academic');
    } else if (category === 'non-teaching') {
      filtered = filtered.filter(d => d.users?.staff_category !== 'academic');
      if (type === 'junior') {
        filtered = filtered.filter(d => d.users?.staff_category === 'junior_nonteaching');
      } else if (type === 'senior') {
        filtered = filtered.filter(d => d.users?.staff_category === 'senior_nonteaching');
      }
    }

    res.json({ appraisals: filtered });
  } catch (err) {
    console.error('Get decided appraisals error:', err);
    res.status(500).json({ error: 'Failed to fetch decisions.' });
  }
};

// POST /api/promotions/appraisals/:id/recommend  (was: /decide)
const recordRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body;

    const validDecisions = ['promoted', 'increment', 'both', 'deferred', 'not_eligible'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({ error: `Decision must be one of: ${validDecisions.join(', ')}` });
    }

    const appraisal = await db('appraisals').select('staff_id').where({ id }).first();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });

    const [data] = await db('appraisals').where({ id }).update({
      apc_decision: {
        decision,
        notes,
        apc_id: req.user.id,
        recommended_by: req.user.full_name || req.user.email,
        decided_at: new Date().toISOString(),
      },
      status: 'apc_recommended',
    }).returning('*');

    const decisionMessages = {
      promoted: 'The A&PC has recommended you for promotion. This is the final decision for this appraisal cycle.',
      increment: 'The A&PC has recommended you for a salary increment. This is the final decision for this appraisal cycle.',
      both: 'The A&PC has recommended you for promotion and salary increment. This is the final decision for this appraisal cycle.',
      deferred: 'Your promotion application has been deferred. Please see notes for details.',
      not_eligible: 'Your promotion application has not been approved at this time.',
    };

    await db('notifications').insert({
      id: uuidv4(),
      user_id: appraisal.staff_id,
      type: 'promotion_decision',
      title: 'A&PC Recommendation',
      message: decisionMessages[decision],
    });

    await db('audit_logs').insert({
      id: uuidv4(),
      user_id: req.user.id,
      action: `APC_RECOMMEND_${decision.toUpperCase()}`,
      entity_type: 'appraisals',
      entity_id: id,
    });

    res.json({ message: 'Recommendation recorded. This is the final decision for this appraisal cycle.', appraisal: data });
  } catch (err) {
    console.error('Record recommendation error:', err);
    res.status(500).json({ error: 'Failed to record recommendation.' });
  }
};

// Backwards-compat alias — old endpoint was /decide, keep it working
const recordDecision = recordRecommendation;

module.exports = { getEligibleAppraisals, getDecidedAppraisals, recordRecommendation, recordDecision };
