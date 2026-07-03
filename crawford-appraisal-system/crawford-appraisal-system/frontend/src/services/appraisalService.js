import axios from 'axios';

// ─── Data normalisation ───────────────────────────────────────────────────────
// Transforms v2 API (snake_case, Supabase) shapes back to the v1 shapes
// that all existing UI pages were built against.

const STATUS_MAP = {
  hod_assessed: 'assessed',
  reporting_officer_assessed: 'ro_assessed',
  college_board_reviewing: 'assessed',
  college_board_approved: 'assessed',
  college_board_reviewed: 'college_board_reviewed',
  staff_viewed: 'viewed',
  dispute_raised: 'disputed',
  disputed: 'disputed',
  dean_resolved: 'resolved',
  completed: 'completed',
};

const normalizeName = (full_name = '') => {
  const parts = full_name.trim().split(' ');
  return { surname: parts[0] || '', firstName: parts.slice(1).join(' ') || '' };
};

const normalizeAppraisal = (a) => {
  if (!a) return null;
  const u = a.users || {};
  const names = normalizeName(u.full_name);
  const part1Base = {
    surname: names.surname,
    firstName: names.firstName,
    department: u.department,
    college: u.college,
    rank: u.current_rank,
    staffId: u.staff_id,
    highestQualification: u.highest_qualification,
    dateOfFirstAppointment: u.date_of_first_appointment,
    dateOfLastPromotion: u.date_of_last_promotion,
  };
  return {
    id: a.id,
    staffId: a.staff_id,
    category: a.staff_category,
    year: a.appraisal_year,
    status: STATUS_MAP[a.status] || a.status,
    rawStatus: a.status,
    submittedAt: a.part1_submitted_at || null,
    part1: { ...part1Base, ...(a.part1_data || {}) },
    hodAssessment: a.hod_grades
      ? { ...a.hod_grades, recommendation: a.hod_recommendation, submittedAt: a.hod_assessed_at }
      : null,
    collegeBoardStatus: a.college_board_status,
    collegeBoardRecommendation: a.college_board_recommendation || null,
    collegeBoardNotes: a.college_board_notes || null,
    registryValidated: a.registry_validated || false,
    staffComment: a.staff_comment || null,
    staffDispute: a.staff_counter_comment
      ? { comment: a.staff_counter_comment, submittedAt: a.staff_action_at }
      : null,
    deanResolution: a.dean_resolution
      ? { resolution: a.dean_resolution, resolvedAt: a.dean_resolved_at }
      : null,
    apcDecision: a.apc_decision
      ? { ...a.apc_decision, decidedAt: a.apc_decision.decided_at }
      : null,
    councilDecision: a.council_decision
      ? { ...a.council_decision, decidedAt: a.council_decision.decided_at }
      : null,
  };
};

// ─── Appraisals ───────────────────────────────────────────────────────────────

export const getMyAppraisal = async (_staffId, year) => {
  const res = await axios.get('/api/appraisals/my', { params: { year } });
  const list = res.data.appraisals || [];
  const match = list.find(a => a.appraisal_year === year) || list[0] || null;
  return normalizeAppraisal(match);
};

export const createAppraisal = async (_staffId, category, year, part1) => {
  try {
    const res = await axios.post('/api/appraisals', { appraisal_year: year, staff_category: category, part1_data: part1 });
    return res.data.appraisal?.id;
  } catch (err) {
    // If a draft already exists (e.g. frontend lost state after a crash),
    // return the existing ID so the caller can update it instead.
    const existingId = err.response?.data?.existingId;
    if (existingId) return existingId;
    throw err;
  }
};

export const saveDraft = async (appraisalId, part1) => {
  await axios.put(`/api/appraisals/${appraisalId}/part1`, { part1_data: part1 });
};

export const submitAppraisal = async (appraisalId) => {
  await axios.post(`/api/appraisals/${appraisalId}/submit`);
};

// ─── HOD Assessment ───────────────────────────────────────────────────────────

export const getDepartmentAppraisals = async (_department, year) => {
  const res = await axios.get('/api/appraisals/department', { params: { appraisal_year: year } });
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const submitHODAssessment = async (appraisalId, assessment, _staffCategory) => {
  const { recommendation, ...grades } = assessment;
  await axios.post(`/api/assessments/${appraisalId}/assess`, {
    hod_grades: grades,
    hod_recommendation: recommendation,
  });
};

export const getHODSubmissions = async (year) => {
  const res = await axios.get('/api/appraisals/hod-submissions', { params: { appraisal_year: year } });
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const getDeanSubmissions = async (year) => {
  const res = await axios.get('/api/appraisals/dean-submissions', { params: { appraisal_year: year } });
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const submitDeanAssessment = async (appraisalId, assessment) => {
  const { recommendation, ...grades } = assessment;
  await axios.post(`/api/assessments/${appraisalId}/assess`, {
    hod_grades: grades,
    hod_recommendation: recommendation,
  });
};

export const getDeanStats = async () => {
  const res = await axios.get('/api/assessments/dean/stats');
  return res.data;
};

// ─── College Board ────────────────────────────────────────────────────────────

export const getPendingCollegeBoardReviews = async (_year) => {
  const res = await axios.get('/api/assessments/college-board/pending');
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const getApprovedCollegeBoardReviews = async () => {
  const res = await axios.get('/api/assessments/college-board/approved');
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const collegeBoardApprove = async (appraisalId, _reviewerId, notes) => {
  await axios.put(`/api/assessments/${appraisalId}/college-board-review`, { status: 'approved', notes });
};

export const collegeBoardFlag = async (appraisalId, _reviewerId, notes) => {
  await axios.put(`/api/assessments/${appraisalId}/college-board-review`, { status: 'flagged', notes });
};

// ─── Disputes ────────────────────────────────────────────────────────────────

export const validateAssessment = async (appraisalId) => {
  await axios.post(`/api/appraisals/${appraisalId}/respond`, { action: 'validated' });
};

export const submitDispute = async (appraisalId, _staffId, comment) => {
  await axios.post(`/api/appraisals/${appraisalId}/respond`, {
    action: 'disputed',
    counter_comment: comment,
  });
};

export const resolveDispute = async (appraisalId, _deanId, resolution) => {
  await axios.put(`/api/assessments/${appraisalId}/resolve-dispute`, { resolution });
};

export const getPendingDisputes = async (_college, _year) => {
  const res = await axios.get('/api/assessments/disputes/pending');
  return (res.data.disputes || []).map(normalizeAppraisal);
};

// ─── Publications ─────────────────────────────────────────────────────────────

export const getMyPublications = async (_staffId) => {
  const res = await axios.get('/api/publications/my');
  return { publications: res.data.publications || [], summary: res.data.summary || {} };
};

export const addPublication = async (_staffId, formData) => {
  const isFormData = formData instanceof FormData;
  const res = await axios.post('/api/publications', formData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return res.data.publication;
};

export const deletePublication = async (id) => {
  await axios.delete(`/api/publications/${id}`);
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const getMyNotifications = async (_userId) => {
  const res = await axios.get('/api/notifications');
  return res.data.notifications || [];
};

export const markNotificationRead = async (notificationId) => {
  await axios.put(`/api/notifications/${notificationId}/read`);
};

export const markAllNotificationsRead = async () => {
  await axios.put('/api/notifications/read-all');
};

// ─── APC / Promotions ────────────────────────────────────────────────────────

export const getEligibleAppraisals = async (year) => {
  const res = await axios.get('/api/promotions/eligible', { params: { appraisal_year: year } });
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const getDecidedAppraisals = async (year, decision) => {
  const res = await axios.get('/api/promotions/decisions', { params: { appraisal_year: year, decision } });
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const recordPromotionDecision = async (appraisalId, _apcId, decision, notes) => {
  await axios.post(`/api/promotions/appraisals/${appraisalId}/decide`, { decision, notes });
};

// ─── Council ──────────────────────────────────────────────────────────────────

export const getCouncilPending = async (year) => {
  const res = await axios.get('/api/council/pending', { params: { appraisal_year: year } });
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const getCouncilDecisions = async (year, decision) => {
  const res = await axios.get('/api/council/decisions', { params: { appraisal_year: year, decision } });
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const getCouncilStats = async () => {
  const res = await axios.get('/api/council/stats');
  return res.data;
};

export const recordCouncilDecision = async (appraisalId, decision, notes) => {
  await axios.post(`/api/council/appraisals/${appraisalId}/decide`, { decision, notes });
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAdminStats = async () => {
  const res = await axios.get('/api/admin/stats');
  return res.data;
};

export const getAllUsers = async () => {
  const res = await axios.get('/api/admin/users');
  return res.data.users || [];
};

export const updateUserProfile = async (uid, data) => {
  await axios.put(`/api/admin/users/${uid}`, data);
};

export const createUserAccount = async (data) => {
  const res = await axios.post('/api/admin/users', data);
  return res.data.user;
};

export const getDeadlines = async (year) => {
  const res = await axios.get('/api/admin/deadlines', { params: { year } });
  return res.data.deadlines || [];
};

export const saveDeadline = async (year, type, date, description) => {
  await axios.post('/api/admin/deadlines', { year, type, date, description });
};

export const getAllAppraisals = async (year) => {
  const res = await axios.get('/api/admin/appraisals', { params: { year } });
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const getAuditLogs = async (limitCount = 100) => {
  const res = await axios.get('/api/admin/audit', { params: { limit: limitCount } });
  return res.data.logs || [];
};

export const logAction = async (_userId, _action, _details) => {
  // Backend handles audit logging internally; no-op on frontend
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const updateProfile = async (data) => {
  await axios.put('/api/auth/profile', data);
};

export const changePassword = async (newPassword) => {
  await axios.put('/api/auth/password', { new_password: newPassword });
};

export const getCollegeOverview = async () => {
  const res = await axios.get('/api/assessments/dean/overview');
  return res.data;
};

export const getDeanCollegeBoardQueue = async () => {
  const res = await axios.get('/api/assessments/dean/college-board-queue');
  return (res.data.appraisals || []).map(normalizeAppraisal);
};

export const submitCollegeBoardReview = async (appraisalId, recommendation, notes) => {
  await axios.put(`/api/assessments/${appraisalId}/dean-college-board-review`, { recommendation, notes });
};
