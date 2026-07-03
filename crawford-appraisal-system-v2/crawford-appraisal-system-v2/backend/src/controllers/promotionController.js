const { supabase } = require('../config/supabase');

// Minimum overall score thresholds per rank
const MIN_OVERALL_SCORES = {
  'Assistant Lecturer': 15,
  'Lecturer II': 25,
  'Lecturer I': 40,
  'Senior Lecturer': 55,
  'Associate Professor': 65,
  'Professor': 75
};

// Minimum publication points per rank
const MIN_PUBLICATION_POINTS = {
  'Lecturer II': 10,
  'Lecturer I': 16,
  'Senior Lecturer': 22,
  'Associate Professor': 26,
  'Professor': 30
};

// Minimum number of academic publications per rank
const MIN_PUBLICATIONS_COUNT = {
  'Lecturer II': 2,
  'Lecturer I': 5,
  'Senior Lecturer': 15,
  'Associate Professor': 20,
  'Professor': 25
};

// Minimum APER percentage per rank
const MIN_APER = {
  'Assistant Lecturer': 20,
  'Lecturer II': 40,
  'Lecturer I': 55,
  'Senior Lecturer': 65,
  'Associate Professor': 75,
  'Professor': 75
};

// Get all staff eligible for promotion/increment (A&PC)
const getEligibleStaff = async (req, res) => {
  try {
    const { appraisal_year, category } = req.query;

    let query = supabase
      .from('promotion_tracking')
      .select(`
        *,
        users!promotion_tracking_staff_id_fkey(
          full_name, staff_id, department, college,
          current_rank, staff_category, date_of_last_promotion,
          date_of_first_appointment
        )
      `)
      .eq('apc_decision', 'pending');

    if (appraisal_year) query = query.eq('appraisal_year', appraisal_year);

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    // Filter by category if specified
    const filtered = category
      ? data.filter(d => d.users?.staff_category === category)
      : data;

    res.json({ eligible_staff: filtered });
  } catch (error) {
    console.error('Get eligible staff error:', error);
    res.status(500).json({ error: 'Failed to fetch eligible staff.' });
  }
};

// Check promotion eligibility for a staff member
const checkEligibility = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { appraisal_year } = req.query;

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', staffId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    // Calculate years in current rank
    const lastDate = user.date_of_last_promotion || user.date_of_first_appointment;
    const yearsInRank = lastDate
      ? Math.floor((new Date() - new Date(lastDate)) / (365.25 * 24 * 60 * 60 * 1000))
      : 0;

    const meetsWaitingPeriod = yearsInRank >= 3;
    const meetsAcceleratedCriteria = yearsInRank >= 2;

    let eligibilityResult = {
      staff_id: staffId,
      full_name: user.full_name,
      current_rank: user.current_rank,
      staff_category: user.staff_category,
      years_in_current_rank: yearsInRank,
      meets_waiting_period: meetsWaitingPeriod,
      eligible_for_accelerated: meetsAcceleratedCriteria && !meetsWaitingPeriod
    };

    // Academic staff additional checks
    if (user.staff_category === 'academic') {
      const { data: tracking } = await supabase
        .from('promotion_tracking')
        .select('*')
        .eq('staff_id', staffId)
        .eq('appraisal_year', appraisal_year)
        .single();

      if (tracking) {
        const targetRank = getNextRank(user.current_rank);
        const minScore = MIN_OVERALL_SCORES[targetRank] || 0;
        const minPubPoints = MIN_PUBLICATION_POINTS[targetRank] || 0;
        const minAper = MIN_APER[targetRank] || 0;

        eligibilityResult = {
          ...eligibilityResult,
          target_rank: targetRank,
          total_score: tracking.total_score,
          publication_points: tracking.publication_points,
          aper_percentage: tracking.aper_percentage,
          meets_minimum_score: tracking.total_score >= minScore,
          meets_publication_requirement: tracking.publication_points >= minPubPoints,
          meets_aper_requirement: tracking.aper_percentage >= minAper,
          is_eligible_for_promotion:
            meetsWaitingPeriod &&
            tracking.total_score >= minScore &&
            tracking.publication_points >= minPubPoints &&
            tracking.aper_percentage >= minAper,
          is_eligible_for_increment: meetsWaitingPeriod && tracking.total_score >= minScore
        };
      }
    } else {
      // Non-academic staff — experience and qualification based
      eligibilityResult = {
        ...eligibilityResult,
        is_eligible_for_promotion: meetsWaitingPeriod,
        is_eligible_for_increment: yearsInRank >= 1,
        note: 'Non-academic staff eligibility is based on years of experience and qualifications.'
      };
    }

    res.json({ eligibility: eligibilityResult });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({ error: 'Failed to check eligibility.' });
  }
};

// A&PC records promotion/increment decision
const recordDecision = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { decision, notes, promoted_to_rank, appraisal_year } = req.body;

    const validDecisions = ['promote', 'increment', 'both', 'defer', 'reject'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        error: `Decision must be one of: ${validDecisions.join(', ')}`
      });
    }

    // Update promotion tracking
    const { data, error } = await supabase
      .from('promotion_tracking')
      .update({
        apc_decision: decision,
        apc_decided_by: req.user.id,
        apc_decision_notes: notes || null,
        apc_decided_at: new Date().toISOString(),
        promoted_to_rank: promoted_to_rank || null,
        promotion_effective_date: ['promote', 'both'].includes(decision)
          ? getPromotionEffectiveDate()
          : null
      })
      .eq('staff_id', staffId)
      .eq('appraisal_year', appraisal_year)
      .select()
      .single();

    if (error) throw error;

    // Update user's current rank if promoted
    if (['promote', 'both'].includes(decision) && promoted_to_rank) {
      await supabase
        .from('users')
        .update({
          current_rank: promoted_to_rank,
          date_of_last_promotion: getPromotionEffectiveDate()
        })
        .eq('id', staffId);
    }

    // Notify staff of decision
    const decisionMessages = {
      promote: 'Congratulations! You have been approved for promotion.',
      increment: 'Congratulations! You have been approved for a salary increment.',
      both: 'Congratulations! You have been approved for both promotion and salary increment.',
      defer: 'Your promotion application has been deferred. Please see the notes for details.',
      reject: 'Your promotion application has not been approved at this time. Please see the notes for details.'
    };

    await supabase.from('notifications').insert({
      user_id: staffId,
      type: 'promotion_decision',
      title: 'Promotion/Increment Decision',
      message: decisionMessages[decision]
    });

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: `PROMOTION_DECISION_${decision.toUpperCase()}`,
      entity_type: 'promotion_tracking',
      entity_id: staffId
    });

    res.json({
      message: 'Decision recorded successfully.',
      tracking: data
    });
  } catch (error) {
    console.error('Record decision error:', error);
    res.status(500).json({ error: 'Failed to record decision.' });
  }
};

// Get promotion history for a staff member
const getPromotionHistory = async (req, res) => {
  try {
    const staffId = req.params.staffId || req.user.id;

    const { data, error } = await supabase
      .from('promotion_tracking')
      .select('*')
      .eq('staff_id', staffId)
      .order('appraisal_year', { ascending: false });

    if (error) throw error;
    res.json({ history: data });
  } catch (error) {
    console.error('Get promotion history error:', error);
    res.status(500).json({ error: 'Failed to fetch promotion history.' });
  }
};

// Helper: Get next rank for academic staff
const getNextRank = (currentRank) => {
  const ranks = [
    'Graduate Assistant',
    'Assistant Lecturer',
    'Lecturer II',
    'Lecturer I',
    'Senior Lecturer',
    'Associate Professor',
    'Professor'
  ];
  const index = ranks.indexOf(currentRank);
  return index >= 0 && index < ranks.length - 1 ? ranks[index + 1] : currentRank;
};

// Helper: Get promotion effective date (October 1 of current/next year)
const getPromotionEffectiveDate = () => {
  const now = new Date();
  const year = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(year, 9, 1).toISOString().split('T')[0];
};

module.exports = {
  getEligibleStaff,
  checkEligibility,
  recordDecision,
  getPromotionHistory
};
