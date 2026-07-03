const { supabase } = require('../config/supabase');

// ─── Stats ───────────────────────────────────────────────────────────────────

const getAdminStats = async (req, res) => {
  try {
    const [{ data: users }, { data: appraisals }] = await Promise.all([
      supabase.from('users').select('id, department, is_active'),
      supabase.from('appraisals').select('id, status'),
    ]);

    const totalUsers = users?.length || 0;
    const departments = [...new Set((users || []).map(u => u.department).filter(Boolean))].length;
    const activeAppraisals = (appraisals || []).filter(a =>
      !['draft', 'completed', 'dean_resolved'].includes(a.status)
    ).length;
    const pendingActions = (appraisals || []).filter(a =>
      ['submitted', 'college_board_reviewing', 'disputed'].includes(a.status)
    ).length;

    res.json({ total_users: totalUsers, active_appraisals: activeAppraisals, pending_actions: pendingActions, departments });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

// ─── Users ────────────────────────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('full_name');
    if (error) throw error;
    res.json({ users: data });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, full_name, role, staff_id, department, college, current_rank, staff_category } = req.body;
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Email, password, full name, and role are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authError) {
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }
      throw authError;
    }

    const { data: profile, error: profileError } = await supabase.from('users').insert({
      id: authData.user.id, email, full_name, role,
      staff_id: staff_id || null,
      department: department || null,
      college: college || null,
      current_rank: current_rank || null,
      staff_category: staff_category || null,
      is_active: true,
    }).select().single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    await supabase.from('audit_logs').insert({
      user_id: req.user.id, action: 'ADMIN_USER_CREATED', entity_type: 'users', entity_id: profile.id,
    });

    res.status(201).json({ message: 'User created successfully.', user: profile });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: err.message || 'Failed to create user.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, department, college, is_active, current_rank, staff_category } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (role !== undefined) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (college !== undefined) updates.college = college;
    if (is_active !== undefined) updates.is_active = is_active;
    if (current_rank !== undefined) updates.current_rank = current_rank;
    if (staff_category !== undefined) updates.staff_category = staff_category;

    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;

    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'ADMIN_USER_UPDATED',
      entity_type: 'users',
      entity_id: id,
      new_data: updates,
    });

    res.json({ message: 'User updated successfully.', user: data });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

// ─── Deadlines ────────────────────────────────────────────────────────────────

const getDeadlines = async (req, res) => {
  try {
    const { year } = req.query;
    const { data, error } = await supabase.from('appraisal_deadlines')
      .select('*').eq('appraisal_year', year || '2025/2026').limit(1).single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

    if (!data) return res.json({ deadlines: [] });

    // Expand into flat array matching the frontend's { type, date, description } shape
    const deadlines = [
      { id: `${data.id}_staff`, type: 'staff_submission', date: data.staff_submission_deadline, description: 'Staff submission deadline' },
      { id: `${data.id}_hod`, type: 'hod_assessment', date: data.hod_assessment_deadline, description: 'HOD assessment deadline' },
      { id: `${data.id}_cb`, type: 'college_board_review', date: data.college_board_review_deadline, description: 'College Board review deadline' },
      { id: `${data.id}_apc`, type: 'apc_decisions', date: data.apc_review_deadline, description: 'A&PC review deadline' },
    ];

    res.json({ deadlines });
  } catch (err) {
    console.error('Get deadlines error:', err);
    res.status(500).json({ error: 'Failed to fetch deadlines.' });
  }
};

const saveDeadline = async (req, res) => {
  try {
    const { year, type, date, description } = req.body;

    const columnMap = {
      staff_submission: 'staff_submission_deadline',
      hod_assessment: 'hod_assessment_deadline',
      college_board_review: 'college_board_review_deadline',
      apc_decisions: 'apc_review_deadline',
    };

    const col = columnMap[type];
    if (!col) return res.status(400).json({ error: 'Invalid deadline type.' });

    // Upsert the row for this year
    const { data: existing } = await supabase.from('appraisal_deadlines')
      .select('id').eq('appraisal_year', year).single();

    if (existing) {
      await supabase.from('appraisal_deadlines').update({ [col]: date }).eq('id', existing.id);
    } else {
      const defaults = { staff_submission_deadline: date, hod_assessment_deadline: date, college_board_review_deadline: date, apc_review_deadline: date };
      await supabase.from('appraisal_deadlines').insert({
        appraisal_year: year, ...defaults, [col]: date, created_by: req.user.id,
      });
    }

    res.json({ message: 'Deadline saved successfully.' });
  } catch (err) {
    console.error('Save deadline error:', err);
    res.status(500).json({ error: 'Failed to save deadline.' });
  }
};

// ─── Reports ──────────────────────────────────────────────────────────────────

const getAllAppraisals = async (req, res) => {
  try {
    const { year } = req.query;
    let q = supabase.from('appraisals')
      .select('*, users!appraisals_staff_id_fkey(full_name, staff_id, department, college, current_rank, staff_category)');
    if (year) q = q.eq('appraisal_year', year);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ appraisals: data });
  } catch (err) {
    console.error('Get all appraisals error:', err);
    res.status(500).json({ error: 'Failed to fetch appraisals.' });
  }
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────

const getAuditLogs = async (req, res) => {
  try {
    const limitCount = parseInt(req.query.limit) || 100;
    const { data, error } = await supabase.from('audit_logs').select('*')
      .order('created_at', { ascending: false }).limit(limitCount);
    if (error) throw error;
    res.json({ logs: data });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
};

// ─── System Settings ──────────────────────────────────────────────────────────

const getCycleStatus = async (req, res) => {
  try {
    const { data, error } = await supabase.from('system_settings')
      .select('key, value').in('key', ['cycle_open', 'current_appraisal_year']);
    if (error) throw error;
    const map = (data || []).reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
    res.json({
      cycle_open: map.cycle_open === 'true',
      current_year: map.current_appraisal_year || '2025/2026',
    });
  } catch (err) {
    console.error('Cycle status error:', err);
    res.json({ cycle_open: false, current_year: '2025/2026' });
  }
};

const getSettings = async (req, res) => {
  try {
    const { data, error } = await supabase.from('system_settings').select('*');
    if (error) throw error;
    const settings = (data || []).reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json({ settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const rows = Object.entries(updates).map(([key, value]) => ({
      key, value: String(value), updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('system_settings').upsert(rows, { onConflict: 'key' });
    if (error) throw error;
    await supabase.from('audit_logs').insert({
      user_id: req.user.id, action: 'ADMIN_SETTINGS_UPDATED', entity_type: 'system_settings', entity_id: null,
    });
    res.json({ message: 'Settings updated successfully.' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
};

// ─── Onboarding Excel Template ────────────────────────────────────────────────

const NON_TEACHING_CADRES = {
  'Clerical Officer':            ['Clerical Assistant','Clerical Officer','Senior Clerical Officer','Assistant Chief Clerical Officer','Chief Clerical Officer'],
  'Typist':                      ['Typist Grade III','Typist Grade II','Typist Grade I','Senior Typist II','Senior Typist I','Chief Typist'],
  'Confidential Secretary':      ['Confidential Secretary Grade III','Confidential Secretary Grade II','Confidential Secretary Grade I','Senior Confidential Secretary','Principal Confidential Secretary II','Principal Confidential Secretary I','Assistant Chief Confidential Secretary','Chief Confidential Secretary'],
  'Technical Instructor':        ['Technical Instructor II','Technical Instructor I','Senior Technical Instructor','Principal Technical Instructor','Chief Technical Instructor'],
  'Administrative Officer':      ['Administrative Officer II','Administrative Officer I','Assistant Registrar','Senior Assistant Registrar','Principal Assistant Registrar','Deputy Registrar','Registrar'],
  'Executive Officer':           ['Executive Officer','Higher Executive Officer','Senior Executive Officer','Principal Executive Officer II','Principal Executive Officer I','Assistant Chief Executive Officer','Chief Executive Officer'],
  'Porter':                      ['Porter','Senior Porter','Chief Porter','Assistant Supervisor (Porters)','Supervisor (Porters)','Senior Supervisor (Porters)'],
  'Security':                    ['Patrolman','Security Assistant','Senior Security Assistant','Head Security Assistant','Chief Security Assistant','Security Officer','Higher Security Officer','Senior Security Officer','Principal Security Officer II','Principal Security Officer I','Assistant Chief Security Officer','Chief Security Officer'],
  'Accountant':                  ['Accountant II','Accountant I','Senior Accountant','Principal Accountant','Chief Accountant','Deputy Bursar','Bursar'],
  'Supplies Officer':            ['Assistant Supplies Officer','Supplies Officer II','Supplies Officer I','Senior Supplies Officer','Principal Supplies Officer','Deputy Chief Supplies Officer','Chief Supplies Officer'],
  'Store Officer':               ['Assistant Stores Officer','Stores Officer','Higher Stores Officer','Senior Stores Officer','Chief Stores Officer'],
  'Internal Auditor':            ['Internal Auditor II','Internal Auditor I','Senior Internal Auditor','Principal Internal Auditor','Assistant Chief Internal Auditor','Chief Internal Auditor'],
  'Driver / Mechanic':           ['Motor Driver Grade III','Motor Driver Grade II','Senior Motor Driver II','Senior Motor Driver I','Superintendent Driver','Senior Superintendent Driver II','Senior Superintendent Driver I'],
  'Telephone Operator':          ['Telephone Operator in Training','Telephone Operator','Senior Telephone Operator','Telephone Supervisor','Telephone Exchange Superintendent','Senior Telephone Exchange Superintendent'],
  'Craftsman':                   ['Assistant Craftsman','Craftsman','Senior Craftsman','Foreman','Workshop Supervisor','Senior Workshop Supervisor II','Senior Workshop Supervisor I'],
  'Technical Assistant':         ['Labourer','Attendant','Technical Assistant','Senior Technical Assistant II','Senior Technical Assistant I','Chief Technical Assistant'],
  'Technical Officer':           ['Assistant Technical Officer','Technical Officer','Higher Technical Officer','Senior Technical Officer','Principal Technical Officer II','Principal Technical Officer I','Assistant Chief Technical Officer','Chief Technical Officer'],
  'Technologist':                ['Assistant Technologist','Senior Assistant Technologist','Technologist II','Technologist I','Senior Technologist','Principal Technologist','Assistant Chief Technologist','Chief Technologist'],
  'Laboratory Staff':            ['Laboratory Attendant','Head Laboratory Attendant','Laboratory Assistant','Senior Laboratory Assistant','Laboratory Supervisor','Senior Laboratory Supervisor','Laboratory Superintendent','Senior Laboratory Superintendent'],
  'System Analyst / Computer Programmer': ['Computer Programmer II','Computer Programmer I','System Analyst II','System Analyst I','Senior System Analyst','Principal System Analyst','Chief System Analyst'],
  'Accountant':                  ['Accountant II','Accountant I','Senior Accountant','Principal Accountant','Chief Accountant','Deputy Bursar','Bursar'],
  'Nursing Officer':             ['Nursing Officer','Higher Nursing Officer','Senior Nursing Officer','Principal Nursing Officer','Assistant Chief Nursing Officer','Chief Nursing Officer'],
  'Library Officer':             ['Assistant Library Officer','Library Officer','Higher Library Officer','Senior Library Officer','Principal Library Officer II','Principal Library Officer I','Assistant Chief Library Officer','Chief Library Officer'],
  'Engineer':                    ['Pupil Engineer','Engineer Grade II','Engineer Grade I','Senior Engineer','Assistant Chief Engineer','Chief Engineer','Director of Works'],
  'Architect':                   ['Architect Grade II','Architect Grade I','Senior Architect','Principal Architect','Assistant Chief Architect','Chief Architect','Assistant Director of Works','Director of Works'],
  'Horticulturist':              ['Horticulturist II','Horticulturist I','Senior Horticulturist','Principal Horticulturist','Assistant Chief Horticulturist','Chief Horticulturist'],
  'Catering / Housekeeping':     ['Catering / Housekeeping Supervisor','Higher Catering / Housekeeping Officer','Senior Catering / Housekeeping Officer','Principal Catering / Housekeeping Officer','Assistant Chief Catering / Housekeeping Officer','Chief Catering / Housekeeping Officer'],
};

const TEACHING_RANKS = ['Graduate Assistant','Assistant Lecturer','Lecturer II','Lecturer I','Senior Lecturer','Associate Professor','Professor'];
const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
const SEX_OPTIONS    = ['Male','Female'];
const STATUS_OPTIONS = ['Permanent','Contract','Temporary','Sabbatical'];

const generateOnboardingTemplate = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Crawford University Appraisal System';
    wb.created = new Date();

    const NAVY   = 'FF1B3A6B';
    const WHITE  = 'FFFFFFFF';
    const YELLOW = 'FFFFF3CD';
    const LGREY  = 'FFF1F5F9';
    const BLUE   = 'FFDBEAFE';

    const hFont  = { bold: true, color: { argb: WHITE  }, size: 11, name: 'Calibri' };
    const hFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY   } };
    const exFont = { italic: true, color: { argb: 'FF94A3B8' }, size: 10, name: 'Calibri' };
    const exFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE   } };
    const nFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } };
    const nFont  = { bold: true, color: { argb: 'FF92400E' }, size: 10, name: 'Calibri' };
    const dFont  = { name: 'Calibri', size: 10 };
    const thin   = { style: 'thin', color: { argb: 'FFD1D5DB' } };
    const border = { top: thin, left: thin, bottom: thin, right: thin };

    const addInstructionRow = (ws, msg, colCount) => {
      const row = ws.addRow([msg]);
      ws.mergeCells(row.number, 1, row.number, colCount);
      row.getCell(1).fill = nFill;
      row.getCell(1).font = nFont;
      row.getCell(1).alignment = { wrapText: true, vertical: 'middle' };
      row.height = 32;
    };

    const addHeaders = (ws, headers) => {
      const row = ws.addRow(headers.map(h => h.label));
      headers.forEach((h, i) => {
        const cell = row.getCell(i + 1);
        cell.fill   = hFill;
        cell.font   = hFont;
        cell.border = border;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        ws.getColumn(i + 1).width = h.width || 20;
      });
      row.height = 40;
      return row;
    };

    const addExampleRow = (ws, values, colCount) => {
      const row = ws.addRow(values);
      for (let i = 1; i <= colCount; i++) {
        row.getCell(i).fill   = exFill;
        row.getCell(i).font   = exFont;
        row.getCell(i).border = border;
        row.getCell(i).alignment = { vertical: 'middle', wrapText: true };
      }
      row.height = 22;
    };

    const styleDataRows = (ws, fromRow, toRow, colCount) => {
      for (let r = fromRow; r <= toRow; r++) {
        const row = ws.getRow(r);
        for (let c = 1; c <= colCount; c++) {
          row.getCell(c).border = border;
          row.getCell(c).font   = dFont;
          row.getCell(c).alignment = { vertical: 'middle' };
        }
        row.height = 20;
        row.commit();
      }
    };

    const addDropdown = (ws, col, fromRow, toRow, formula, title, errMsg) => {
      for (let r = fromRow; r <= toRow; r++) {
        ws.getCell(r, col).dataValidation = {
          type: 'list', allowBlank: true, showErrorMessage: true,
          formulae: [formula], errorTitle: title, error: errMsg,
        };
      }
    };

    // ── Hidden reference sheet for dropdown sources ───────────────────────────
    const COLLEGES = [
      'College of Natural and Applied Sciences (CONAS)',
      'College of Arts and Communication Studies (CACOS)',
      'College of Business & Social Sciences (CBSS)',
      'Postgraduate School',
      'School of Postgraduate & Training Studies (SPTS)',
      'Central Administration',
      'Registry',
      'Bursary',
      'Library',
      'Works & Services',
      'Student Affairs',
      'Medical Centre',
      'ICT Services',
      'Security',
      'NIL',
    ];

    const refSheet = wb.addWorksheet('_Reference', { state: 'veryHidden' });
    refSheet.getColumn(1).values = ['_Ranks',    ...TEACHING_RANKS];
    refSheet.getColumn(2).values = ['_Cadres',   ...Object.keys(NON_TEACHING_CADRES)];
    const allGrades = [...new Set(Object.values(NON_TEACHING_CADRES).flat())];
    refSheet.getColumn(3).values = ['_Grades',   ...allGrades];
    refSheet.getColumn(4).values = ['_States',   ...NIGERIAN_STATES];
    refSheet.getColumn(5).values = ['_Sex',      ...SEX_OPTIONS];
    refSheet.getColumn(6).values = ['_Status',   ...STATUS_OPTIONS];
    refSheet.getColumn(7).values = ['_Colleges', ...COLLEGES];

    const fRank    = `_Reference!$A$2:$A${TEACHING_RANKS.length + 1}`;
    const fCadre   = `_Reference!$B$2:$B${Object.keys(NON_TEACHING_CADRES).length + 1}`;
    const fGrade   = `_Reference!$C$2:$C${allGrades.length + 1}`;
    const fState   = `_Reference!$D$2:$D${NIGERIAN_STATES.length + 1}`;
    const fSex     = `_Reference!$E$2:$E${SEX_OPTIONS.length + 1}`;
    const fStatus  = `_Reference!$F$2:$F${STATUS_OPTIONS.length + 1}`;
    const fCollege = `_Reference!$G$2:$G${COLLEGES.length + 1}`;

    const DATA_ROWS = 30;
    const DATA_FROM = 5;   // header=row3, example=row4, data starts row5
    const DATA_TO   = DATA_FROM + DATA_ROWS - 1;

    // Column layout (ALL sheets):
    // A(1)-S/N  B(2)-Staff ID  C(3)-Full Name  D(4)-Sex  E(5)-DOB  F(6)-State
    // G(7)-Qualification  H(8)-Salary Grade  I(9)-Status  J(10)-Department  K(11)-College
    // Teaching:    L(12)-Designation  M(13)-Email  N(14)-Password  O(15)-DOA  P(16)-Last Promo  Q(17)-Confirmation
    // NonTeaching: L(12)-Cadre  M(13)-Grade Level  N(14)-Email  O(15)-Password  P(16)-DOA  Q(17)-Last Promo  R(18)-Confirmation

    // ── Sheet 1: Teaching Staff ───────────────────────────────────────────────
    const ts = wb.addWorksheet('Teaching Staff');
    ts.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

    const TS_COLS = 17;
    addInstructionRow(ts,
      'CRAWFORD UNIVERSITY — TEACHING (ACADEMIC) STAFF ONBOARDING TEMPLATE  |  ' +
      'Fill from Row 5 downward. Shaded row (Row 4) is an example — do not submit. ' +
      'Staff ID format: CU/STF/001. Date format: DD/MM/YYYY. Password min. 8 characters.',
      TS_COLS);
    addInstructionRow(ts,
      'REQUIRED FIELDS (must be filled): Full Name, Staff ID, Sex, Date of Birth, State of Origin, Salary Grade, Status, Department, College, Designation, Email Address, Password, Date of 1st Appointment, Date of Confirmation.',
      TS_COLS);

    addHeaders(ts, [
      { label: 'S/N',                           width: 6  },
      { label: 'Staff ID *',                    width: 16 },
      { label: 'Full Name *',                   width: 28 },
      { label: 'Sex *',                         width: 10 },
      { label: 'Date of Birth *',               width: 16 },
      { label: 'State of Origin *',             width: 18 },
      { label: 'Qualification',                 width: 28 },
      { label: 'Salary Grade *',                width: 18 },
      { label: 'Status *',                      width: 14 },
      { label: 'Department *',                  width: 26 },
      { label: 'College *',                     width: 30 },
      { label: 'Designation *',                 width: 24 },
      { label: 'Email Address *',               width: 32 },
      { label: 'Password * (min 8 chars)',       width: 22 },
      { label: 'Date of 1st Appointment *',      width: 22 },
      { label: 'Date of Last Promotion',         width: 22 },
      { label: 'Date of Confirmation *',         width: 22 },
    ]);
    addExampleRow(ts, [
      1, 'CU/STF/001', 'Dr. Adebayo John', 'Male', '15/04/1980', 'Ogun',
      'B.Sc, M.Sc, Ph.D', 'CUASS 7 STEP 5', 'Permanent',
      'Computer Science', 'College of Natural and Applied Sciences',
      'Lecturer II', 'adebayo.john@crawford.edu.ng', 'Crawford@123',
      '01/09/2015', '01/01/2021', '01/09/2016',
    ], TS_COLS);

    for (let i = 0; i < DATA_ROWS; i++) {
      const row = ts.addRow([i + 1]);
      row.getCell(1).font      = { name: 'Calibri', size: 10, color: { argb: 'FF94A3B8' } };
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    styleDataRows(ts, DATA_FROM, DATA_TO, TS_COLS);

    // S/N column: narrow, center-aligned, light grey background
    ts.getColumn(1).width = 6;
    for (let r = DATA_FROM; r <= DATA_TO; r++) {
      ts.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }

    addDropdown(ts,  4, DATA_FROM, DATA_TO, fSex,     'Invalid Sex',         'Select Male or Female.');
    addDropdown(ts,  6, DATA_FROM, DATA_TO, fState,   'Invalid State',       'Select a Nigerian state from the list.');
    addDropdown(ts,  9, DATA_FROM, DATA_TO, fStatus,  'Invalid Status',      'Select employment status from the list.');
    addDropdown(ts, 11, DATA_FROM, DATA_TO, fCollege, 'Invalid College',     'Select a college from the list, or NIL if not applicable.');
    addDropdown(ts, 12, DATA_FROM, DATA_TO, fRank,    'Invalid Designation', 'Select a valid academic rank from the list.');

    // ── Sheet 2: Junior Non-Teaching ─────────────────────────────────────────
    const jnt = wb.addWorksheet('Non-Teaching (Junior)');
    jnt.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

    const NT_COLS = 18;
    addInstructionRow(jnt,
      'CRAWFORD UNIVERSITY — JUNIOR NON-TEACHING STAFF ONBOARDING TEMPLATE  |  ' +
      'Fill from Row 5. Staff ID format: CU/STF/001. Date: DD/MM/YYYY. ' +
      'See "Cadre Reference" sheet for valid Cadre → Grade Level combinations.',
      NT_COLS);
    addInstructionRow(jnt,
      'REQUIRED FIELDS (must be filled): Full Name, Staff ID, Sex, Date of Birth, State of Origin, Salary Grade, Status, Department, College, Cadre, Grade Level, Email Address, Password, Date of 1st Appointment, Date of Confirmation.',
      NT_COLS);

    const ntHeaderDefs = [
      { label: 'S/N',                           width: 6  },
      { label: 'Staff ID *',                    width: 16 },
      { label: 'Full Name *',                   width: 28 },
      { label: 'Sex *',                         width: 10 },
      { label: 'Date of Birth *',               width: 16 },
      { label: 'State of Origin *',             width: 18 },
      { label: 'Qualification',                 width: 28 },
      { label: 'Salary Grade *',                width: 18 },
      { label: 'Status *',                      width: 14 },
      { label: 'Department *',                  width: 26 },
      { label: 'College *',                     width: 30 },
      { label: 'Cadre *',                       width: 30 },
      { label: 'Grade Level *',                 width: 38 },
      { label: 'Email Address *',               width: 32 },
      { label: 'Password * (min 8 chars)',       width: 22 },
      { label: 'Date of 1st Appointment *',      width: 22 },
      { label: 'Date of Last Promotion',         width: 22 },
      { label: 'Date of Confirmation *',         width: 22 },
    ];
    addHeaders(jnt, ntHeaderDefs);
    addExampleRow(jnt, [
      1, 'CU/STF/050', 'Miss Amaka Obiora', 'Female', '22/07/1990', 'Anambra',
      'B.Sc', 'CUANSS 3 STEP 2', 'Permanent',
      'Registry', 'Central Administration',
      'Clerical Officer', 'Senior Clerical Officer',
      'a.obiora@crawford.edu.ng', 'Crawford@123',
      '15/03/2018', '', '15/03/2019',
    ], NT_COLS);

    for (let i = 0; i < DATA_ROWS; i++) {
      const row = jnt.addRow([i + 1]);
      row.getCell(1).font      = { name: 'Calibri', size: 10, color: { argb: 'FF94A3B8' } };
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    styleDataRows(jnt, DATA_FROM, DATA_TO, NT_COLS);
    jnt.getColumn(1).width = 6;
    for (let r = DATA_FROM; r <= DATA_TO; r++) {
      jnt.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }

    addDropdown(jnt,  4, DATA_FROM, DATA_TO, fSex,     'Invalid Sex',        'Select Male or Female.');
    addDropdown(jnt,  6, DATA_FROM, DATA_TO, fState,   'Invalid State',      'Select a Nigerian state from the list.');
    addDropdown(jnt,  9, DATA_FROM, DATA_TO, fStatus,  'Invalid Status',     'Select employment status from the list.');
    addDropdown(jnt, 11, DATA_FROM, DATA_TO, fCollege, 'Invalid College',    'Select a college from the list, or NIL if not applicable.');
    addDropdown(jnt, 12, DATA_FROM, DATA_TO, fCadre,   'Invalid Cadre',     'Select a cadre from the list. See Cadre Reference sheet.');
    addDropdown(jnt, 13, DATA_FROM, DATA_TO, fGrade,   'Invalid Grade Level','Select the grade level matching the cadre. See Cadre Reference sheet.');

    // ── Sheet 3: Senior Non-Teaching ─────────────────────────────────────────
    const snt = wb.addWorksheet('Non-Teaching (Senior)');
    snt.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

    addInstructionRow(snt,
      'CRAWFORD UNIVERSITY — SENIOR NON-TEACHING STAFF ONBOARDING TEMPLATE  |  ' +
      'Fill from Row 5. Staff ID format: CU/STF/001. Date: DD/MM/YYYY. ' +
      'See "Cadre Reference" sheet for valid Cadre → Grade Level combinations.',
      NT_COLS);
    addInstructionRow(snt,
      'REQUIRED FIELDS (must be filled): Full Name, Staff ID, Sex, Date of Birth, State of Origin, Salary Grade, Status, Department, College, Cadre, Grade Level, Email Address, Password, Date of 1st Appointment, Date of Confirmation.',
      NT_COLS);

    addHeaders(snt, ntHeaderDefs);
    addExampleRow(snt, [
      1, 'CU/STF/051', 'Mr. Bola Fashola', 'Male', '10/11/1975', 'Lagos',
      'B.Sc, MBA', 'CUANSS 7 STEP 3', 'Permanent',
      'Finance', 'Central Administration',
      'Executive Officer', 'Senior Executive Officer',
      'b.fashola@crawford.edu.ng', 'Crawford@123',
      '01/06/2012', '01/06/2018', '01/06/2013',
    ], NT_COLS);

    for (let i = 0; i < DATA_ROWS; i++) {
      const row = snt.addRow([i + 1]);
      row.getCell(1).font      = { name: 'Calibri', size: 10, color: { argb: 'FF94A3B8' } };
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    styleDataRows(snt, DATA_FROM, DATA_TO, NT_COLS);
    snt.getColumn(1).width = 6;
    for (let r = DATA_FROM; r <= DATA_TO; r++) {
      snt.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }

    addDropdown(snt,  4, DATA_FROM, DATA_TO, fSex,     'Invalid Sex',        'Select Male or Female.');
    addDropdown(snt,  6, DATA_FROM, DATA_TO, fState,   'Invalid State',      'Select a Nigerian state from the list.');
    addDropdown(snt,  9, DATA_FROM, DATA_TO, fStatus,  'Invalid Status',     'Select employment status from the list.');
    addDropdown(snt, 11, DATA_FROM, DATA_TO, fCollege, 'Invalid College',    'Select a college from the list, or NIL if not applicable.');
    addDropdown(snt, 12, DATA_FROM, DATA_TO, fCadre,   'Invalid Cadre',     'Select a cadre from the list. See Cadre Reference sheet.');
    addDropdown(snt, 13, DATA_FROM, DATA_TO, fGrade,   'Invalid Grade Level','Select the grade level matching the cadre. See Cadre Reference sheet.');

    // ── Sheet 4: Cadre Reference ──────────────────────────────────────────────
    const ref = wb.addWorksheet('Cadre Reference');
    const refTitleRow = ref.addRow(['Crawford University — Non-Teaching Staff Cadre & Grade Level Reference']);
    ref.mergeCells(1, 1, 1, 2);
    refTitleRow.getCell(1).fill = hFill;
    refTitleRow.getCell(1).font = { ...hFont, size: 13 };
    refTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    refTitleRow.height = 36;

    const refNote = ref.addRow(['Use this sheet to identify the correct Grade Level for each Cadre. Enter both Cadre and Grade Level exactly as shown.']);
    ref.mergeCells(2, 1, 2, 2);
    refNote.getCell(1).fill = nFill;
    refNote.getCell(1).font = nFont;
    refNote.getCell(1).alignment = { wrapText: true, vertical: 'middle' };
    refNote.height = 24;

    const refHdr = ref.addRow(['CADRE', 'GRADE LEVEL']);
    refHdr.getCell(1).fill = hFill; refHdr.getCell(1).font = hFont; refHdr.getCell(1).border = border;
    refHdr.getCell(2).fill = hFill; refHdr.getCell(2).font = hFont; refHdr.getCell(2).border = border;
    refHdr.height = 28;
    ref.getColumn(1).width = 40;
    ref.getColumn(2).width = 50;

    let isFirstGrade = true;
    for (const [cadre, grades] of Object.entries(NON_TEACHING_CADRES)) {
      grades.forEach((grade, gi) => {
        const row = ref.addRow([gi === 0 ? cadre : '', grade]);
        if (gi === 0) {
          row.getCell(1).font   = { bold: true, size: 10, name: 'Calibri' };
          row.getCell(1).fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: isFirstGrade ? 'FFF0F9FF' : LGREY } };
        }
        row.getCell(1).border = border;
        row.getCell(2).border = border;
        row.getCell(2).font   = dFont;
        row.getCell(2).alignment = { vertical: 'middle' };
        row.height = 18;
      });
      isFirstGrade = !isFirstGrade;
      ref.addRow([]); // spacer between cadres
    }

    // ── Stream response ───────────────────────────────────────────────────────
    const filename = `Crawford_Staff_Onboarding_Template_${new Date().getFullYear()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Onboarding template error:', err);
    res.status(500).json({ error: 'Failed to generate template.' });
  }
};

// ─── Bulk Onboard from Excel ───────────────────────────────────────────────────

const bulkOnboard = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  try {
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);

    // Sheet name → staff_category mapping
    const SHEET_MAP = {
      //                                                                                                          DOA   Promo  Conf
      'Teaching Staff':        { category: 'academic',           emailCol: 13, passCol: 14, rankCol: 12, cadreCol: null, gradeCol: null, doaCol: 15, promoCol: 16, confCol: 17 },
      'Non-Teaching (Junior)': { category: 'junior_nonteaching', emailCol: 14, passCol: 15, rankCol: null, cadreCol: 12, gradeCol: 13,   doaCol: 16, promoCol: 17, confCol: 18 },
      'Non-Teaching (Senior)': { category: 'senior_nonteaching', emailCol: 14, passCol: 15, rankCol: null, cadreCol: 12, gradeCol: 13,   doaCol: 16, promoCol: 17, confCol: 18 },
    };

    const results = { total: 0, created: 0, skipped: 0, errors: [] };

    const cellVal = (row, col) => {
      const cell = row.getCell(col);
      const v = cell.value;
      if (v === null || v === undefined) return '';
      if (typeof v === 'object' && v.text) return String(v.text).trim();
      return String(v).trim();
    };

    for (const [sheetName, cfg] of Object.entries(SHEET_MAP)) {
      const ws = wb.getWorksheet(sheetName);
      if (!ws) continue;

      ws.eachRow((row, rowNum) => {
        if (rowNum <= 4) return; // skip instructions, headers, example

        const staffId    = cellVal(row, 2);
        const fullName   = cellVal(row, 3);
        const sex        = cellVal(row, 4);
        const dobRaw     = cellVal(row, 5);
        const stateOrig  = cellVal(row, 6);
        const qual       = cellVal(row, 7);
        const salGrade   = cellVal(row, 8);
        const empStatus  = cellVal(row, 9);
        const department = cellVal(row, 10);
        const college    = cellVal(row, 11);
        const email      = cellVal(row, cfg.emailCol);
        const password   = cellVal(row, cfg.passCol);
        const doaRaw     = cellVal(row, cfg.doaCol);
        const promoRaw   = cellVal(row, cfg.promoCol);
        const confRaw    = cellVal(row, cfg.confCol);

        // Skip completely empty rows
        if (!staffId && !fullName && !email) return;

        results.total++;

        if (!fullName || !email || !password) {
          results.errors.push({ sheet: sheetName, row: rowNum, reason: `Row ${rowNum}: Missing Full Name, Email, or Password.` });
          return;
        }
        if (password.length < 8) {
          results.errors.push({ sheet: sheetName, row: rowNum, reason: `Row ${rowNum} (${email}): Password must be at least 8 characters.` });
          return;
        }

        const toDate = (v) => {
          if (!v) return null;
          const d = new Date(v);
          return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
        };

        let currentRank = '';
        if (cfg.rankCol) {
          currentRank = cellVal(row, cfg.rankCol);
        } else if (cfg.cadreCol && cfg.gradeCol) {
          const cadre = cellVal(row, cfg.cadreCol);
          const grade = cellVal(row, cfg.gradeCol);
          currentRank = cadre && grade ? `${cadre} — ${grade}` : cadre || grade;
        }

        results._rows = results._rows || [];
        results._rows.push({
          email, password, full_name: fullName,
          staff_id:                  staffId    || null,
          sex:                       sex        || null,
          date_of_birth:             toDate(dobRaw),
          state_of_origin:           stateOrig  || null,
          qualification:             qual       || null,
          salary_grade:              salGrade   || null,
          employment_status:         empStatus  || null,
          department:                department || null,
          college:                   (college && college !== 'NIL') ? college : null,
          current_rank:              currentRank || null,
          date_of_first_appointment: toDate(doaRaw),
          date_of_last_promotion:    toDate(promoRaw),
          confirmation_date:         toDate(confRaw),
          staff_category: cfg.category,
          role: 'staff',
          sheet: sheetName, row: rowNum,
        });
      });
    }

    // Process rows sequentially (avoid rate-limiting Supabase auth)
    for (const r of (results._rows || [])) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
          email: r.email, password: r.password, email_confirm: true,
        });

        if (authErr) {
          const isDupe = authErr.message?.includes('already') || authErr.message?.includes('exists');
          results.errors.push({
            sheet: r.sheet, row: r.row,
            reason: `Row ${r.row} (${r.email}): ${isDupe ? 'Email already registered.' : authErr.message}`,
          });
          results.skipped++;
          continue;
        }

        const { error: profileErr } = await supabase.from('users').insert({
          id:                        authData.user.id,
          email:                     r.email,
          full_name:                 r.full_name,
          role:                      r.role,
          staff_id:                  r.staff_id,
          sex:                       r.sex,
          date_of_birth:             r.date_of_birth,
          state_of_origin:           r.state_of_origin,
          qualification:             r.qualification,
          salary_grade:              r.salary_grade,
          employment_status:         r.employment_status,
          department:                r.department,
          college:                   r.college,
          current_rank:              r.current_rank,
          date_of_first_appointment: r.date_of_first_appointment,
          date_of_last_promotion:    r.date_of_last_promotion,
          confirmation_date:         r.confirmation_date,
          staff_category:            r.staff_category,
          is_active: true,
        });

        if (profileErr) {
          await supabase.auth.admin.deleteUser(authData.user.id);
          results.errors.push({ sheet: r.sheet, row: r.row, reason: `Row ${r.row} (${r.email}): Profile error — ${profileErr.message}` });
          results.skipped++;
          continue;
        }

        results.created++;
      } catch (err) {
        results.errors.push({ sheet: r.sheet, row: r.row, reason: `Row ${r.row}: Unexpected error — ${err.message}` });
        results.skipped++;
      }
    }

    delete results._rows;

    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'BULK_ONBOARD',
      entity_type: 'users',
      new_data: { total: results.total, created: results.created, skipped: results.skipped },
    });

    res.json({
      message: `Bulk onboarding complete. ${results.created} created, ${results.skipped} skipped.`,
      ...results,
    });
  } catch (err) {
    console.error('Bulk onboard error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
};

module.exports = { getAdminStats, getAllUsers, createUser, updateUser, getDeadlines, saveDeadline, getAllAppraisals, getAuditLogs, getCycleStatus, getSettings, updateSettings, generateOnboardingTemplate, bulkOnboard };
