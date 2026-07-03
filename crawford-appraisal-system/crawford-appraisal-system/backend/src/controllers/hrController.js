const { supabase } = require('../config/supabase');
const ExcelJS = require('exceljs');

const logAudit = async (userId, action, entityType, entityId) => {
  try {
    await supabase.from('audit_logs').insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId });
  } catch (err) { console.error('Audit log error:', err); }
};

// GET /api/hr/stats
const getHRStats = async (req, res) => {
  try {
    const [
      { data: teaching },
      { data: junior },
      { data: senior },
    ] = await Promise.all([
      supabase.from('users').select('id').eq('staff_category', 'academic').eq('is_active', true),
      supabase.from('users').select('id').eq('staff_category', 'junior_nonteaching').eq('is_active', true),
      supabase.from('users').select('id').eq('staff_category', 'senior_nonteaching').eq('is_active', true),
    ]);

    res.json({
      teaching_staff: teaching?.length || 0,
      junior_nonteaching: junior?.length || 0,
      senior_nonteaching: senior?.length || 0,
      total_staff: (teaching?.length || 0) + (junior?.length || 0) + (senior?.length || 0),
    });
  } catch (err) {
    console.error('HR stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

// GET /api/hr/teaching-staff
const getTeachingStaff = async (req, res) => {
  try {
    const { q, department } = req.query;

    let query = supabase.from('users')
      .select(`
        id, full_name, staff_id, email, department, college,
        current_rank, staff_category, is_active,
        appraisals!appraisals_staff_id_fkey(id, status, appraisal_year, apc_decision)
      `)
      .eq('staff_category', 'academic')
      .eq('is_active', true)
      .order('full_name');

    if (department) query = query.eq('department', department);

    const { data, error } = await query;
    if (error) throw error;

    const filtered = q
      ? (data || []).filter(u =>
          u.full_name?.toLowerCase().includes(q.toLowerCase()) ||
          u.staff_id?.toLowerCase().includes(q.toLowerCase())
        )
      : data;

    res.json({ staff: filtered || [] });
  } catch (err) {
    console.error('Get teaching staff error:', err);
    res.status(500).json({ error: 'Failed to fetch teaching staff.' });
  }
};

// GET /api/hr/non-teaching-staff
const getNonTeachingStaff = async (req, res) => {
  try {
    const { type, q, department } = req.query; // type: 'junior' | 'senior'

    const categoryMap = {
      junior: 'junior_nonteaching',
      senior: 'senior_nonteaching',
    };

    let query = supabase.from('users')
      .select(`
        id, full_name, staff_id, email, department, college,
        current_rank, staff_category, is_active, reporting_officer_id,
        appraisals!appraisals_staff_id_fkey(id, status, appraisal_year, apc_decision, registry_validated)
      `)
      .eq('is_active', true)
      .order('full_name');

    if (type && categoryMap[type]) {
      query = query.eq('staff_category', categoryMap[type]);
    } else {
      query = query.in('staff_category', ['junior_nonteaching', 'senior_nonteaching']);
    }

    if (department) query = query.eq('department', department);

    const { data, error } = await query;
    if (error) throw error;

    const filtered = q
      ? (data || []).filter(u =>
          u.full_name?.toLowerCase().includes(q.toLowerCase()) ||
          u.staff_id?.toLowerCase().includes(q.toLowerCase())
        )
      : data;

    res.json({ staff: filtered || [] });
  } catch (err) {
    console.error('Get non-teaching staff error:', err);
    res.status(500).json({ error: 'Failed to fetch non-teaching staff.' });
  }
};

// GET /api/hr/staff/:id/appraisal
const getStaffAppraisalForPrint = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error: userErr } = await supabase.from('users')
      .select('*').eq('id', id).single();
    if (userErr || !user) return res.status(404).json({ error: 'Staff member not found.' });

    const { data: appraisal, error: appErr } = await supabase.from('appraisals')
      .select('*')
      .eq('staff_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (appErr && appErr.code !== 'PGRST116') throw appErr;

    await logAudit(req.user.id, 'HR_APPRAISAL_VIEWED', 'users', id);
    res.json({ user, appraisal: appraisal || null });
  } catch (err) {
    console.error('Get staff appraisal for print error:', err);
    res.status(500).json({ error: 'Failed to fetch staff appraisal.' });
  }
};

// GET /api/hr/export/excel
const exportNominalRoll = async (req, res) => {
  try {
    const { category, type } = req.query;

    let query = supabase.from('users').select(`
      id, full_name, staff_id, email, department, college,
      current_rank, staff_category, date_of_first_appointment, date_of_last_promotion, is_active,
      appraisals!appraisals_staff_id_fkey(id, status, appraisal_year, apc_decision, registry_validated,
        hod_recommendation, hod_assessed_at)
    `).eq('is_active', true).order('full_name');

    if (category === 'teaching') {
      query = query.eq('staff_category', 'academic');
    } else if (category === 'non-teaching') {
      if (type === 'junior') {
        query = query.eq('staff_category', 'junior_nonteaching');
      } else if (type === 'senior') {
        query = query.eq('staff_category', 'senior_nonteaching');
      } else {
        query = query.in('staff_category', ['junior_nonteaching', 'senior_nonteaching']);
      }
    }

    const { data: staff, error } = await query;
    if (error) throw error;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Crawford University Appraisal System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Staff Nominal Roll', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    sheet.columns = [
      { header: 'S/N',                key: 'sn',               width: 6  },
      { header: 'Staff ID',           key: 'staff_id',         width: 15 },
      { header: 'Full Name',          key: 'full_name',        width: 28 },
      { header: 'Department',         key: 'department',       width: 22 },
      { header: 'College',            key: 'college',          width: 18 },
      { header: 'Category',           key: 'staff_category',   width: 22 },
      { header: 'Current Grade/Rank', key: 'current_rank',     width: 20 },
      { header: 'First Appointment',  key: 'first_appointment',width: 18 },
      { header: 'Last Promotion',     key: 'last_promotion',   width: 16 },
      { header: 'Appraisal Year',     key: 'appraisal_year',   width: 15 },
      { header: 'Appraisal Status',   key: 'appraisal_status', width: 22 },
      { header: 'Recommendation',     key: 'recommendation',   width: 22 },
      { header: 'Council Status',     key: 'council_status',   width: 18 },
    ];

    // Header row styling — Crawford navy
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 30;

    sheet.autoFilter = { from: 'A1', to: 'M1' };

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const categoryLabels = {
      academic: 'Academic (Teaching)',
      junior_nonteaching: 'Non-Teaching (Junior)',
      senior_nonteaching: 'Non-Teaching (Senior)',
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

    (staff || []).forEach((s, idx) => {
      const latestAppraisal = (s.appraisals || [])
        .sort((a, b) => (b.appraisal_year || '').localeCompare(a.appraisal_year || ''))[0];

      const apcDecision = latestAppraisal?.apc_decision;
      const recommendation = apcDecision?.decision
        ? apcDecision.decision.charAt(0).toUpperCase() + apcDecision.decision.slice(1).replace('_', ' ')
        : '—';

      const row = sheet.addRow({
        sn: idx + 1,
        staff_id: s.staff_id || '—',
        full_name: s.full_name || '—',
        department: s.department || '—',
        college: s.college || '—',
        staff_category: categoryLabels[s.staff_category] || s.staff_category || '—',
        current_rank: s.current_rank || '—',
        first_appointment: formatDate(s.date_of_first_appointment),
        last_promotion: formatDate(s.date_of_last_promotion),
        appraisal_year: latestAppraisal?.appraisal_year || '—',
        appraisal_status: latestAppraisal?.status
          ? latestAppraisal.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          : 'Not Submitted',
        recommendation,
        council_status: apcDecision ? 'Pending Council' : '—',
      });

      // Alternate row banding
      if (idx % 2 === 1) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
      }

      row.alignment = { vertical: 'middle', wrapText: false };
      row.height = 18;
    });

    // Add totals row
    const totalsRow = sheet.addRow({
      sn: '',
      staff_id: '',
      full_name: `Total: ${(staff || []).length} staff`,
      department: '', college: '', staff_category: '', current_rank: '',
      first_appointment: '', last_promotion: '', appraisal_year: '',
      appraisal_status: '', recommendation: '', council_status: '',
    });
    totalsRow.font = { bold: true };
    totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };

    await logAudit(req.user.id, 'HR_EXCEL_EXPORT', 'users', null);

    const categoryLabel = category === 'teaching' ? 'Teaching' : type ? `NonTeaching_${type}` : 'All';
    const filename = `Crawford_Staff_NominalRoll_${categoryLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ error: 'Failed to generate Excel export.' });
  }
};

// GET /api/hr/recommendations  — JSON list for the preview table
const getRecommendations = async (req, res) => {
  try {
    const { year = '2025/2026', recommendation = 'all', category = 'all' } = req.query;

    let query = supabase.from('appraisals')
      .select(`
        id, appraisal_year, status, hod_recommendation,
        apc_decision, council_decision, registry_validated, college_board_status, college_board_recommendation,
        users!appraisals_staff_id_fkey(
          id, full_name, staff_id, email, department, college,
          current_rank, staff_category,
          date_of_first_appointment, date_of_last_promotion
        )
      `)
      .eq('appraisal_year', year)
      .not('apc_decision', 'is', null);

    if (recommendation !== 'all') {
      query = query.filter('apc_decision->>decision', 'eq', recommendation);
    }

    const { data, error } = await query;
    if (error) throw error;

    let result = (data || []).filter(a => a.users);

    if (category === 'teaching') {
      result = result.filter(a => a.users?.staff_category === 'academic');
    } else if (category === 'non-teaching') {
      result = result.filter(a => ['junior_nonteaching', 'senior_nonteaching'].includes(a.users?.staff_category));
    }

    result.sort((a, b) => (a.users?.full_name || '').localeCompare(b.users?.full_name || ''));

    const counts = result.reduce((acc, a) => {
      const d = a.apc_decision?.decision || 'unknown';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});

    res.json({ recommendations: result, count: result.length, counts });
  } catch (err) {
    console.error('Get recommendations error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations.' });
  }
};

// GET /api/hr/export/recommendations  — Excel download
const exportRecommendations = async (req, res) => {
  try {
    const { year = '2025/2026', recommendation = 'all', category = 'all' } = req.query;

    let query = supabase.from('appraisals')
      .select(`
        id, appraisal_year, status, hod_recommendation,
        apc_decision, council_decision, registry_validated, college_board_status, college_board_recommendation,
        users!appraisals_staff_id_fkey(
          id, full_name, staff_id, email, department, college,
          current_rank, staff_category,
          date_of_first_appointment, date_of_last_promotion
        )
      `)
      .eq('appraisal_year', year)
      .not('apc_decision', 'is', null);

    if (recommendation !== 'all') {
      query = query.filter('apc_decision->>decision', 'eq', recommendation);
    }

    const { data, error } = await query;
    if (error) throw error;

    let records = (data || []).filter(a => a.users);

    if (category === 'teaching') {
      records = records.filter(a => a.users?.staff_category === 'academic');
    } else if (category === 'non-teaching') {
      records = records.filter(a => ['junior_nonteaching', 'senior_nonteaching'].includes(a.users?.staff_category));
    }

    records.sort((a, b) => (a.users?.full_name || '').localeCompare(b.users?.full_name || ''));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Crawford University Appraisal System';
    workbook.created = new Date();

    // ── Main data sheet ────────────────────────────────────────────────────────
    const sheet = workbook.addWorksheet('Recommendations', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });

    // University title rows
    const titleRow = sheet.addRow(['CRAWFORD UNIVERSITY, IGBESA — STAFF APPRAISAL RECOMMENDATIONS REPORT']);
    sheet.mergeCells(`A1:T1`);
    titleRow.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 26;

    const subRow = sheet.addRow([
      `Appraisal Year: ${year}  |  Category: ${category === 'all' ? 'All Staff' : category === 'teaching' ? 'Academic (Teaching)' : 'Non-Teaching'}  |  Filter: ${recommendation === 'all' ? 'All Recommendations' : recommendation.replace('_', ' + ').replace(/\b\w/g, c => c.toUpperCase())}  |  Printed: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    ]);
    sheet.mergeCells(`A2:T2`);
    subRow.font = { italic: true, size: 10, color: { argb: 'FF444444' } };
    subRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    subRow.alignment = { horizontal: 'center', vertical: 'middle' };
    subRow.height = 18;

    sheet.addRow([]); // spacer

    sheet.columns = [
      { key: 'sn',             width: 5  },
      { key: 'staff_id',       width: 14 },
      { key: 'full_name',      width: 26 },
      { key: 'department',     width: 22 },
      { key: 'college',        width: 20 },
      { key: 'category',       width: 20 },
      { key: 'current_rank',   width: 28 },
      { key: 'first_appt',     width: 15 },
      { key: 'last_promo',     width: 15 },
      { key: 'years_in_grade', width: 13 },
      { key: 'appraisal_year', width: 13 },
      { key: 'status',         width: 20 },
      { key: 'hod_assess',     width: 20 },
      { key: 'apc_rec',        width: 22 },
      { key: 'apc_notes',      width: 30 },
      { key: 'apc_by',         width: 20 },
      { key: 'apc_date',       width: 14 },
      { key: 'council_dec',    width: 14 },
      { key: 'council_notes',  width: 26 },
      { key: 'council_date',   width: 14 },
    ];

    const headers = [
      'S/N', 'Staff ID', 'Full Name', 'Department', 'College', 'Category',
      'Current Grade / Rank', 'First Appointment', 'Last Promotion', 'Yrs in Grade',
      'Appraisal Year', 'Appraisal Status', 'HOD Assessment',
      'A&PC Recommendation', 'A&PC Notes', 'Recommended By', 'A&PC Date',
      'Council Decision', 'Council Notes', 'Council Date',
    ];

    const headerRow = sheet.getRow(4);
    headers.forEach((h, i) => { headerRow.getCell(i + 1).value = h; });
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 32;

    sheet.autoFilter = { from: 'A4', to: 'T4' };
    sheet.views = [{ state: 'frozen', ySplit: 4 }];

    const categoryLabels = {
      academic: 'Academic (Teaching)',
      junior_nonteaching: 'Non-Teaching (Junior)',
      senior_nonteaching: 'Non-Teaching (Senior)',
    };

    const apcLabels = {
      promoted: 'Recommend Promotion',
      increment: 'Recommend Increment',
      both: 'Promotion + Increment',
      deferred: 'Deferred',
      not_eligible: 'Not Eligible',
    };

    const apcColors = {
      promoted:    'FFD9EAD3',
      increment:   'FFD9E8F5',
      both:        'FFD0F0E0',
      deferred:    'FFFFF2CC',
      not_eligible:'FFFCE5CD',
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

    const yearsInGrade = (lastPromo) => {
      if (!lastPromo) return '—';
      const years = ((new Date() - new Date(lastPromo)) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
      return `${years} yrs`;
    };

    records.forEach((a, idx) => {
      const u = a.users || {};
      const apc = a.apc_decision || {};
      const council = a.council_decision || {};
      const decisionKey = apc.decision || '';
      const rowColor = apcColors[decisionKey] || 'FFFFFFFF';

      const row = sheet.addRow({
        sn:             idx + 1,
        staff_id:       u.staff_id || '—',
        full_name:      u.full_name || '—',
        department:     u.department || '—',
        college:        u.college || '—',
        category:       categoryLabels[u.staff_category] || u.staff_category || '—',
        current_rank:   u.current_rank || '—',
        first_appt:     formatDate(u.date_of_first_appointment),
        last_promo:     formatDate(u.date_of_last_promotion),
        years_in_grade: yearsInGrade(u.date_of_last_promotion),
        appraisal_year: a.appraisal_year || '—',
        status:         a.status ? a.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—',
        hod_assess:     a.hod_recommendation || '—',
        apc_rec:        apcLabels[decisionKey] || decisionKey || '—',
        apc_notes:      apc.notes || '—',
        apc_by:         apc.recommended_by || '—',
        apc_date:       apc.decidedAt ? formatDate(apc.decidedAt) : '—',
        council_dec:    council.decision ? council.decision.charAt(0).toUpperCase() + council.decision.slice(1) : 'Pending',
        council_notes:  council.notes || '—',
        council_date:   council.decided_at ? formatDate(council.decided_at) : '—',
      });

      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
      row.alignment = { vertical: 'middle', wrapText: false };
      row.height = 18;

      // Bold full name column
      row.getCell(3).font = { bold: true };
    });

    // Totals row
    const totalsRow = sheet.addRow({
      sn: '', staff_id: '',
      full_name: `TOTAL: ${records.length} staff member${records.length !== 1 ? 's' : ''}`,
    });
    totalsRow.font = { bold: true, size: 11 };
    totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    totalsRow.height = 20;

    // ── Summary sheet ──────────────────────────────────────────────────────────
    const summary = workbook.addWorksheet('Summary');

    summary.columns = [
      { key: 'label', width: 35 },
      { key: 'value', width: 18 },
    ];

    const addSummaryRow = (label, value, bold = false, color = null) => {
      const r = summary.addRow({ label, value });
      if (bold) r.font = { bold: true };
      if (color) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      r.alignment = { vertical: 'middle' };
      r.height = 18;
      return r;
    };

    const summaryTitle = summary.addRow(['RECOMMENDATIONS SUMMARY', '']);
    summary.mergeCells('A1:B1');
    summaryTitle.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    summaryTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
    summaryTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    summaryTitle.height = 26;

    summary.addRow([]);

    addSummaryRow('Report Period', year, true);
    addSummaryRow('Generated On', new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    summary.addRow([]);

    addSummaryRow('TOTAL STAFF IN REPORT', records.length, true, 'FFD9E8F5');
    summary.addRow([]);

    addSummaryRow('BY A&PC RECOMMENDATION', '', true, 'FF1F3864');
    const recCounts = records.reduce((acc, a) => {
      const d = a.apc_decision?.decision || 'unknown';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    Object.entries({ promoted: 0, increment: 0, both: 0, deferred: 0, not_eligible: 0 }).forEach(([key]) => {
      const rowColor = apcColors[key] || 'FFFFFFFF';
      addSummaryRow(`  ${apcLabels[key] || key}`, recCounts[key] || 0, false, rowColor);
    });

    summary.addRow([]);
    addSummaryRow('BY STAFF CATEGORY', '', true, 'FF1F3864');
    const catCounts = records.reduce((acc, a) => {
      const c = a.users?.staff_category || 'unknown';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    Object.entries({ academic: 'Academic (Teaching)', junior_nonteaching: 'Non-Teaching (Junior)', senior_nonteaching: 'Non-Teaching (Senior)' }).forEach(([key, label]) => {
      addSummaryRow(`  ${label}`, catCounts[key] || 0);
    });

    summary.addRow([]);
    addSummaryRow('BY COUNCIL DECISION', '', true, 'FF1F3864');
    const councilCounts = records.reduce((acc, a) => {
      const d = a.council_decision?.decision || 'pending';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    ['approved', 'rejected', 'deferred', 'pending'].forEach(key => {
      addSummaryRow(`  ${key.charAt(0).toUpperCase() + key.slice(1)}`, councilCounts[key] || 0);
    });

    await logAudit(req.user.id, 'HR_RECOMMENDATIONS_EXPORTED', 'appraisals', null);

    const catLabel = category === 'all' ? 'AllStaff' : category === 'teaching' ? 'Teaching' : 'NonTeaching';
    const recLabel = recommendation === 'all' ? 'AllRecommendations' : recommendation;
    const filename = `Crawford_Recommendations_${catLabel}_${recLabel}_${year.replace('/', '-')}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export recommendations error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations report.' });
  }
};

// POST /api/hr/onboard-staff
const onboardStaff = async (req, res) => {
  try {
    const {
      email, password, full_name, role, staff_id,
      department, college, current_rank, staff_category, reporting_officer_id,
      sex, date_of_birth, state_of_origin, qualification,
      salary_grade, employment_status,
      date_of_first_appointment, date_of_last_promotion, confirmation_date,
    } = req.body;

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

    const uid = authData.user.id;
    const { data: profile, error: profileError } = await supabase.from('users').insert({
      id: uid, email, full_name, role,
      staff_id:                  staff_id                  || null,
      department:                department                || null,
      college:                   college                   || null,
      current_rank:              current_rank              || null,
      staff_category:            staff_category            || null,
      reporting_officer_id:      reporting_officer_id      || null,
      sex:                       sex                       || null,
      date_of_birth:             date_of_birth             || null,
      state_of_origin:           state_of_origin           || null,
      qualification:             qualification             || null,
      salary_grade:              salary_grade              || null,
      employment_status:         employment_status         || null,
      date_of_first_appointment: date_of_first_appointment || null,
      date_of_last_promotion:    date_of_last_promotion    || null,
      confirmation_date:         confirmation_date         || null,
      is_active: true,
    }).select().single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(uid).catch(() => {});
      throw profileError;
    }

    await logAudit(req.user.id, 'HR_STAFF_ONBOARDED', 'users', uid);
    res.status(201).json({ message: 'Staff member onboarded successfully.', user: profile });
  } catch (err) {
    console.error('Onboard staff error:', err);
    res.status(500).json({ error: err.message || 'Failed to onboard staff member.' });
  }
};

// PUT /api/hr/staff/:id
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name, staff_id, role, staff_category,
      department, college, current_rank, reporting_officer_id,
      date_of_first_appointment, date_of_last_promotion,
    } = req.body;

    const { data, error } = await supabase.from('users').update({
      full_name:               full_name               || undefined,
      staff_id:                staff_id                || undefined,
      role:                    role                    || undefined,
      staff_category:          staff_category          || undefined,
      department:              department              ?? undefined,
      college:                 college                 ?? undefined,
      current_rank:            current_rank            ?? undefined,
      reporting_officer_id:    reporting_officer_id    || null,
      date_of_first_appointment: date_of_first_appointment || undefined,
      date_of_last_promotion:  date_of_last_promotion  || undefined,
      updated_at:              new Date().toISOString(),
    }).eq('id', id).select().single();

    if (error) throw error;

    await logAudit(req.user.id, 'HR_STAFF_UPDATED', 'users', id);
    res.json({ message: 'Staff profile updated.', user: data });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: err.message || 'Failed to update staff profile.' });
  }
};

// GET /api/hr/reporting-officers  — populate the dropdown in the onboard modal
const getReportingOfficers = async (req, res) => {
  try {
    const { data, error } = await supabase.from('users')
      .select('id, full_name, department')
      .eq('role', 'reporting_officer')
      .eq('is_active', true)
      .order('full_name');
    if (error) throw error;
    res.json({ reporting_officers: data || [] });
  } catch (err) {
    console.error('Get reporting officers error:', err);
    res.status(500).json({ error: 'Failed to fetch reporting officers.' });
  }
};

module.exports = {
  getHRStats,
  getTeachingStaff,
  getNonTeachingStaff,
  getStaffAppraisalForPrint,
  exportNominalRoll,
  getRecommendations,
  exportRecommendations,
  onboardStaff,
  updateStaff,
  getReportingOfficers,
};
