const { supabase } = require('../config/supabase');

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

// GET /api/promotions/eligible
const getEligibleAppraisals = async (req, res) => {
  try {
    let { appraisal_year, category, type, q } = req.query;
    // category: 'teaching' | 'non-teaching'
    // type: 'junior' | 'senior' (only when category = non-teaching)

    // Enforce category scope by role — split APC users cannot see other categories
    const lock = ROLE_CATEGORY_LOCK[req.user?.role];
    if (lock) { category = lock.category; type = lock.type; }

    let query = supabase.from('appraisals')
      .select(`
        *,
        users!appraisals_staff_id_fkey(
          full_name, staff_id, department, college,
          current_rank, staff_category,
          date_of_last_promotion, date_of_first_appointment
        )
      `)
      .in('status', ELIGIBLE_STATUSES)
      .is('apc_decision', null);

    if (appraisal_year) query = query.eq('appraisal_year', appraisal_year);

    const { data, error } = await query.order('hod_assessed_at', { ascending: true });
    if (error) throw error;

    let filtered = data || [];

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

    let query = supabase.from('appraisals')
      .select(`
        *,
        users!appraisals_staff_id_fkey(
          full_name, staff_id, department, current_rank, staff_category
        )
      `)
      .not('apc_decision', 'is', null);

    if (appraisal_year) query = query.eq('appraisal_year', appraisal_year);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    let filtered = data || [];

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

    const { data: appraisal } = await supabase.from('appraisals').select('staff_id').eq('id', id).single();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });

    const { data, error } = await supabase.from('appraisals').update({
      apc_decision: {
        decision,
        notes,
        apc_id: req.user.id,
        recommended_by: req.user.full_name || req.user.email,
        decided_at: new Date().toISOString(),
      },
      status: 'apc_recommended',
    }).eq('id', id).select().single();
    if (error) throw error;

    const decisionMessages = {
      promoted: 'The A&PC has recommended you for promotion. Pending Council approval.',
      increment: 'The A&PC has recommended you for a salary increment. Pending Council approval.',
      both: 'The A&PC has recommended you for promotion and salary increment. Pending Council approval.',
      deferred: 'Your promotion application has been deferred. Please see notes for details.',
      not_eligible: 'Your promotion application has not been approved at this time.',
    };

    await supabase.from('notifications').insert({
      user_id: appraisal.staff_id,
      type: 'promotion_decision',
      title: 'A&PC Recommendation',
      message: decisionMessages[decision],
    });

    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: `APC_RECOMMEND_${decision.toUpperCase()}`,
      entity_type: 'appraisals',
      entity_id: id,
    });

    res.json({ message: 'Recommendation recorded. Pending Council approval.', appraisal: data });
  } catch (err) {
    console.error('Record recommendation error:', err);
    res.status(500).json({ error: 'Failed to record recommendation.' });
  }
};

// Backwards-compat alias — old endpoint was /decide, keep it working
const recordDecision = recordRecommendation;

module.exports = { getEligibleAppraisals, getDecidedAppraisals, recordRecommendation, recordDecision };
