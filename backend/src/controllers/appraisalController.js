const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/db');

const logAudit = async (userId, action, entityType, entityId) => {
  try {
    await db('audit_logs').insert({ id: uuidv4(), user_id: userId, action, entity_type: entityType, entity_id: entityId });
  } catch (err) { console.error('Audit log error:', err); }
};

const notifyUser = async (userId, type, title, message, appraisalId) => {
  try {
    await db('notifications').insert({ id: uuidv4(), user_id: userId, type, title, message, related_appraisal_id: appraisalId });
  } catch (err) { console.error('Notify error:', err); }
};

const getMyAppraisals = async (req, res) => {
  try {
    const { year } = req.query;
    let q = db('appraisals').select('*').where({ staff_id: req.user.id });
    if (year) q = q.andWhere({ appraisal_year: year });
    const data = await q.orderBy('created_at', 'desc');
    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get appraisals error:', err);
    res.status(500).json({ error: 'Failed to fetch appraisals.' });
  }
};

const getAppraisalById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await db('appraisals')
      .select(
        'appraisals.*',
        'u.full_name as u_full_name', 'u.staff_id as u_staff_id', 'u.department as u_department',
        'u.current_rank as u_current_rank', 'u.staff_category as u_staff_category', 'u.college as u_college'
      )
      .leftJoin('users as u', 'appraisals.staff_id', 'u.id')
      .where('appraisals.id', id)
      .first();
    if (!row) return res.status(404).json({ error: 'Appraisal not found.' });

    const { u_full_name, u_staff_id, u_department, u_current_rank, u_staff_category, u_college, ...appraisal } = row;
    const data = {
      ...appraisal,
      users: { full_name: u_full_name, staff_id: u_staff_id, department: u_department, current_rank: u_current_rank, staff_category: u_staff_category, college: u_college },
    };

    const privileged = ['hod', 'hou', 'dean', 'college_board', 'a&pc', 'admin'];
    if (data.staff_id !== req.user.id && !privileged.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Strip HOD assessment for academic staff until College Board approves
    if (req.user.id === data.staff_id && req.user.staff_category === 'academic' && data.college_board_status !== 'approved') {
      data.hod_grades = null;
      data.hod_recommendation = null;
    }

    res.json({ appraisal: data });
  } catch (err) {
    console.error('Get appraisal error:', err);
    res.status(500).json({ error: 'Failed to fetch appraisal.' });
  }
};

const createAppraisal = async (req, res) => {
  try {
    const { appraisal_year, staff_category: body_category, part1_data } = req.body;

    const existing = await db('appraisals').select('id', 'status')
      .where({ staff_id: req.user.id, appraisal_year }).first();
    if (existing) {
      return res.status(400).json({
        error: `You already have an appraisal for ${appraisal_year}.`,
        existingId: existing.id,
        existingStatus: existing.status,
      });
    }

    const staff_category = req.user.staff_category || body_category;
    if (!staff_category) return res.status(400).json({ error: 'Staff category is not set. Contact your administrator.' });

    let data;
    try {
      [data] = await db('appraisals').insert({
        id: uuidv4(),
        staff_id: req.user.id,
        appraisal_year,
        staff_category,
        status: 'draft',
        part1_data: part1_data || null,
      }).returning('*');
    } catch (err) {
      // Unique constraint violation — another request beat us to it
      if (err.code === '23505') {
        const race = await db('appraisals').select('id', 'status')
          .where({ staff_id: req.user.id, appraisal_year }).first();
        return res.status(400).json({
          error: `You already have an appraisal for ${appraisal_year}.`,
          existingId: race?.id,
          existingStatus: race?.status,
        });
      }
      throw err;
    }

    await logAudit(req.user.id, 'APPRAISAL_CREATED', 'appraisals', data.id);
    res.status(201).json({ message: 'Appraisal created successfully.', appraisal: data });
  } catch (err) {
    console.error('Create appraisal error:', err);
    res.status(500).json({ error: 'Failed to create appraisal.', detail: err?.message });
  }
};

const updatePart1 = async (req, res) => {
  try {
    const { id } = req.params;
    const { part1_data } = req.body;

    const appraisal = await db('appraisals').select('*').where({ id, staff_id: req.user.id }).first();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (appraisal.part1_locked) return res.status(400).json({ error: 'Part 1 has been submitted and is now locked.' });

    const [data] = await db('appraisals').where({ id }).update({ part1_data }).returning('*');
    res.json({ message: 'Part 1 saved successfully.', appraisal: data });
  } catch (err) {
    console.error('Update Part 1 error:', err);
    res.status(500).json({ error: 'Failed to save Part 1.' });
  }
};

const submitAppraisal = async (req, res) => {
  try {
    const { id } = req.params;
    const appraisal = await db('appraisals').select('*').where({ id, staff_id: req.user.id }).first();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });
    if (appraisal.status !== 'draft') return res.status(400).json({ error: 'Only draft appraisals can be submitted.' });

    const [data] = await db('appraisals').where({ id }).update({
      status: 'submitted',
      part1_locked: true,
      part1_submitted_at: new Date().toISOString(),
    }).returning('*');

    // Notify HOD (but not if the submitter IS the HOD — their form goes to the Dean)
    const hod = await db('users').select('id')
      .where({ department: req.user.department })
      .whereIn('role', ['hod', 'hou'])
      .whereNot({ id: req.user.id })
      .first();
    if (hod) {
      await notifyUser(hod.id, 'appraisal_submitted', 'New Appraisal Submitted',
        `${req.user.full_name} has submitted their appraisal and is awaiting your assessment.`, id);
    }

    await logAudit(req.user.id, 'APPRAISAL_SUBMITTED', 'appraisals', id);
    res.json({ message: 'Appraisal submitted successfully.', appraisal: data });
  } catch (err) {
    console.error('Submit appraisal error:', err);
    res.status(500).json({ error: 'Failed to submit appraisal.' });
  }
};

const respondToAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, counter_comment } = req.body;

    if (!['validated', 'disputed'].includes(action)) {
      return res.status(400).json({ error: 'Action must be validated or disputed.' });
    }
    if (action === 'disputed' && !counter_comment) {
      return res.status(400).json({ error: 'A counter-comment is required when disputing.' });
    }

    const appraisal = await db('appraisals').select('*').where({ id, staff_id: req.user.id }).first();
    if (!appraisal) return res.status(404).json({ error: 'Appraisal not found.' });

    const respondableStatuses = [
      'hod_assessed',
      'reporting_officer_assessed',
      'registry_validated',
      'college_board_reviewing',
      'college_board_approved',
    ];
    const canView = respondableStatuses.includes(appraisal.status) || !!appraisal.hod_grades;
    if (!canView) return res.status(403).json({ error: 'You cannot respond to the assessment yet.' });

    const newStatus = action === 'disputed' ? 'dispute_raised' : 'staff_viewed';
    const [data] = await db('appraisals').where({ id }).update({
      staff_action: action,
      staff_counter_comment: counter_comment || null,
      staff_action_at: new Date().toISOString(),
      status: newStatus,
    }).returning('*');

    if (action === 'disputed') {
      const dean = await db('users').select('id').where({ college: req.user.college, role: 'dean' }).first();
      if (dean) {
        await notifyUser(dean.id, 'dispute_submitted', 'Appraisal Dispute Submitted',
          `${req.user.full_name} has disputed their appraisal assessment.`, id);
      }
    }

    await logAudit(req.user.id, `APPRAISAL_${action.toUpperCase()}`, 'appraisals', id);
    res.json({
      message: action === 'validated' ? 'Assessment validated.' : 'Dispute submitted. The Dean will review.',
      appraisal: data
    });
  } catch (err) {
    console.error('Respond to assessment error:', err);
    res.status(500).json({ error: 'Failed to process response.' });
  }
};

const getDepartmentAppraisals = async (req, res) => {
  try {
    const { appraisal_year } = req.query;
    const role = req.user.role;

    let staffIds = [];

    if (role === 'reporting_officer') {
      // Reporting Officer: fetch only staff directly assigned to them
      const assignedStaff = await db('users')
        .select('id')
        .where({ reporting_officer_id: req.user.id })
        .whereIn('staff_category', ['junior_nonteaching', 'senior_nonteaching']);
      staffIds = assignedStaff.map(u => u.id);
    } else {
      // HOD/HOU: fetch academic staff in same department
      const deptStaff = await db('users')
        .select('id')
        .where({ department: req.user.department, staff_category: 'academic' })
        .whereNot({ id: req.user.id });
      staffIds = deptStaff.map(u => u.id);
    }

    if (staffIds.length === 0) return res.json({ appraisals: [] });

    let q = db('appraisals')
      .select(
        'appraisals.*',
        'u.full_name as u_full_name', 'u.staff_id as u_staff_id', 'u.current_rank as u_current_rank',
        'u.staff_category as u_staff_category', 'u.department as u_department'
      )
      .leftJoin('users as u', 'appraisals.staff_id', 'u.id')
      .whereIn('appraisals.staff_id', staffIds)
      .whereNot('appraisals.status', 'draft');
    if (appraisal_year) q = q.andWhere('appraisals.appraisal_year', appraisal_year);
    const rows = await q.orderBy('appraisals.created_at', 'desc');

    const data = rows.map(({ u_full_name, u_staff_id, u_current_rank, u_staff_category, u_department, ...appraisal }) => ({
      ...appraisal,
      users: { full_name: u_full_name, staff_id: u_staff_id, current_rank: u_current_rank, staff_category: u_staff_category, department: u_department },
    }));

    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get department appraisals error:', err);
    res.status(500).json({ error: 'Failed to fetch department appraisals.' });
  }
};

const getHODSubmissions = async (req, res) => {
  try {
    const { appraisal_year } = req.query;

    // Dean sees HOD/HOU appraisals from their own college (excluding self)
    const hods = await db('users').select('id')
      .where({ college: req.user.college })
      .whereIn('role', ['hod', 'hou'])
      .whereNot({ id: req.user.id });

    const hodIds = hods.map(u => u.id);
    if (hodIds.length === 0) return res.json({ appraisals: [] });

    let q = db('appraisals')
      .select(
        'appraisals.*',
        'u.full_name as u_full_name', 'u.staff_id as u_staff_id', 'u.current_rank as u_current_rank',
        'u.department as u_department', 'u.staff_category as u_staff_category'
      )
      .leftJoin('users as u', 'appraisals.staff_id', 'u.id')
      .whereIn('appraisals.staff_id', hodIds)
      .whereNot('appraisals.status', 'draft');
    if (appraisal_year) q = q.andWhere('appraisals.appraisal_year', appraisal_year);
    const rows = await q.orderBy('appraisals.created_at', 'desc');

    const data = rows.map(({ u_full_name, u_staff_id, u_current_rank, u_department, u_staff_category, ...appraisal }) => ({
      ...appraisal,
      users: { full_name: u_full_name, staff_id: u_staff_id, current_rank: u_current_rank, department: u_department, staff_category: u_staff_category },
    }));

    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get HOD submissions error:', err);
    res.status(500).json({ error: 'Failed to fetch HOD submissions.' });
  }
};

// GET /api/appraisals/dean-submissions — VC sees all Dean appraisals
const getDeanSubmissions = async (req, res) => {
  try {
    const { appraisal_year } = req.query;

    const deans = await db('users').select('id')
      .where({ role: 'dean' })
      .whereNot({ id: req.user.id });

    const deanIds = deans.map(u => u.id);
    if (deanIds.length === 0) return res.json({ appraisals: [] });

    let q = db('appraisals')
      .select(
        'appraisals.*',
        'u.full_name as u_full_name', 'u.staff_id as u_staff_id', 'u.current_rank as u_current_rank',
        'u.department as u_department', 'u.college as u_college', 'u.staff_category as u_staff_category'
      )
      .leftJoin('users as u', 'appraisals.staff_id', 'u.id')
      .whereIn('appraisals.staff_id', deanIds)
      .whereNot('appraisals.status', 'draft');
    if (appraisal_year) q = q.andWhere('appraisals.appraisal_year', appraisal_year);
    const rows = await q.orderBy('appraisals.created_at', 'desc');

    const data = rows.map(({ u_full_name, u_staff_id, u_current_rank, u_department, u_college, u_staff_category, ...appraisal }) => ({
      ...appraisal,
      users: { full_name: u_full_name, staff_id: u_staff_id, current_rank: u_current_rank, department: u_department, college: u_college, staff_category: u_staff_category },
    }));

    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get Dean submissions error:', err);
    res.status(500).json({ error: 'Failed to fetch Dean submissions.' });
  }
};

// PUT /api/appraisals/my/biodata — updates biodata-specific fields even on locked appraisals
const updateBiodata = async (req, res) => {
  try {
    const BIODATA_FIELDS = [
      'phone', 'officeRoomNumber', 'linkedIn', 'orcid', 'scopus',
      'researchgate', 'googleScholar', 'academia', 'visitingHours',
      'researchInterests', 'personalStatement',
    ];
    const patch = {};
    BIODATA_FIELDS.forEach(f => { if (req.body[f] !== undefined) patch[f] = req.body[f]; });

    const appraisal = await db('appraisals').select('id', 'part1_data')
      .where({ staff_id: req.user.id })
      .orderBy('created_at', 'desc')
      .first();
    if (!appraisal) return res.status(404).json({ error: 'No appraisal found. Please start your appraisal form first.' });

    const merged = { ...(appraisal.part1_data || {}), ...patch };
    await db('appraisals').where({ id: appraisal.id }).update({ part1_data: merged });

    res.json({ message: 'Biodata updated successfully.' });
  } catch (err) {
    console.error('Biodata update error:', err);
    res.status(500).json({ error: 'Failed to update biodata.' });
  }
};

module.exports = { getMyAppraisals, getAppraisalById, createAppraisal, updatePart1, submitAppraisal, respondToAssessment, getDepartmentAppraisals, getHODSubmissions, getDeanSubmissions, updateBiodata };
