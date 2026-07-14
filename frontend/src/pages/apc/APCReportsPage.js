import { useState, useEffect } from 'react';
import { LuAward, LuCoins, LuClock, LuXCircle, LuFileSpreadsheet, LuPrinter } from 'react-icons/lu';
import * as XLSX from 'xlsx';
import api from '../../services/api';

const YEAR = '2025/2026';

const APCReportsPage = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/promotions/decisions')
      .then(res => setAppraisals(res.data.appraisals || []))
      .catch(err => console.error('APC reports fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const counts = appraisals.reduce((acc, a) => {
    const d = a.apc_decision?.decision || 'pending';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const gradeDistribution = appraisals.reduce((acc, a) => {
    const g = a.hod_grades?.overallGrade;
    if (g) acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const handleExportExcel = () => {
    const decisionLabel = d => ({ promoted: 'Promoted', increment: 'Salary Increment', both: 'Promotion & Increment', deferred: 'Deferred', not_eligible: 'Not Eligible' }[d] || d || '—');
    const categoryLabel = c => ({ academic: 'Academic', junior_nonteaching: 'Junior Non-Teaching', senior_nonteaching: 'Senior Non-Teaching' }[c] || c || '—');
    const gradeLabel = g => ({ A: 'A — Very Good', B: 'B — Good', C: 'C — Satisfactory', D: 'D — Fair', E: 'E — Poor' }[g] || g || '—');

    const rows = appraisals.map((a, i) => ({
      'S/N': i + 1,
      'Staff Name': a.users?.full_name || '—',
      'Staff ID': a.users?.staff_id || '—',
      'Department': a.users?.department || '—',
      'College': a.users?.college || '—',
      'Grade Level': a.users?.current_rank || '—',
      'Staff Category': categoryLabel(a.users?.staff_category || a.staff_category),
      'Appraisal Year': a.appraisal_year || YEAR,
      'HOD Overall Grade': gradeLabel(a.hod_grades?.overallGrade),
      'HOD Recommendation': a.hod_recommendation || '—',
      'A&PC Decision': decisionLabel(a.apc_decision?.decision),
      'A&PC Notes': a.apc_decision?.notes || '—',
      'Decision Date': a.apc_decision?.decided_at ? new Date(a.apc_decision.decided_at).toLocaleDateString('en-NG') : '—',
    }));

    // Summary sheet rows
    const summaryRows = [
      { 'Metric': 'Appraisal Year', 'Value': YEAR },
      { 'Metric': 'Report Generated', 'Value': new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' }) },
      { 'Metric': 'Total Decisions', 'Value': appraisals.length },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'Promoted', 'Value': counts.promoted || 0 },
      { 'Metric': 'Salary Increment', 'Value': counts.increment || 0 },
      { 'Metric': 'Promotion & Increment', 'Value': counts.both || 0 },
      { 'Metric': 'Deferred', 'Value': counts.deferred || 0 },
      { 'Metric': 'Not Eligible', 'Value': counts.not_eligible || 0 },
      { 'Metric': '', 'Value': '' },
      ...['A', 'B', 'C', 'D', 'E'].filter(g => gradeDistribution[g]).map(g => ({
        'Metric': `Grade ${g} (${['Very Good','Good','Satisfactory','Fair','Poor'][['A','B','C','D','E'].indexOf(g)]})`,
        'Value': gradeDistribution[g],
      })),
    ];

    const wb = XLSX.utils.book_new();

    // --- Details sheet ---
    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 5 },  // S/N
      { wch: 28 }, // Staff Name
      { wch: 14 }, // Staff ID
      { wch: 22 }, // Department
      { wch: 20 }, // College
      { wch: 22 }, // Rank
      { wch: 22 }, // Category
      { wch: 15 }, // Year
      { wch: 20 }, // HOD Grade
      { wch: 35 }, // HOD Rec
      { wch: 22 }, // Decision
      { wch: 35 }, // Notes
      { wch: 15 }, // Date
    ];

    // AutoFilter across all columns
    ws['!autofilter'] = { ref: `A1:M${rows.length + 1}` };

    // Freeze top header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, ws, 'All Decisions');

    // --- Summary sheet ---
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    XLSX.writeFile(wb, `Crawford_APC_Report_${YEAR.replace('/', '-')}.xlsx`);
  };

  const handlePrint = () => {
    const decisionLabel = d => ({ promoted: 'Promoted', increment: 'Salary Increment', both: 'Promotion & Increment', deferred: 'Deferred', not_eligible: 'Not Eligible' }[d] || d || '—');
    const categoryLabel = c => ({ academic: 'Academic', junior_nonteaching: 'Junior Non-Teaching', senior_nonteaching: 'Senior Non-Teaching' }[c] || c || '—');
    const gradeLabel = g => ({ A: 'A – Very Good', B: 'B – Good', C: 'C – Satisfactory', D: 'D – Fair', E: 'E – Poor' }[g] || g || '—');
    const decisionColor = d => ({ promoted: '#15803d', increment: '#1d4ed8', both: '#6d28d9', deferred: '#b45309', not_eligible: '#b91c1c' }[d] || '#374151');
    const generated = new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' });

    const summaryRow = (label, value, color = '#111827') =>
      `<div class="stat-box"><div class="stat-val" style="color:${color}">${value}</div><div class="stat-lbl">${label}</div></div>`;

    const tableRows = appraisals.map((a, i) => {
      const d = a.apc_decision?.decision;
      const name = a.users?.full_name || '—';
      return `
        <tr>
          <td class="center">${i + 1}</td>
          <td><strong>${name}</strong><br><span class="sub">${a.users?.staff_id || ''}</span></td>
          <td>${a.users?.department || '—'}</td>
          <td>${a.users?.college || '—'}</td>
          <td>${a.users?.current_rank || '—'}</td>
          <td>${categoryLabel(a.users?.staff_category || a.staff_category)}</td>
          <td class="center"><strong>${a.hod_grades?.overallGrade || '—'}</strong><br><span class="sub">${gradeLabel(a.hod_grades?.overallGrade).split('–')[1]?.trim() || ''}</span></td>
          <td class="decision" style="color:${decisionColor(d)}">${decisionLabel(d)}</td>
          <td class="notes">${a.apc_decision?.notes || '—'}</td>
          <td class="center sub">${a.apc_decision?.decided_at ? new Date(a.apc_decision.decided_at).toLocaleDateString('en-NG') : '—'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>A&amp;PC Report — ${YEAR}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #111827; background: #fff; padding: 28px 32px; }

    /* Header */
    .header { display: flex; align-items: center; gap: 18px; border-bottom: 3px solid #1e3a5f; padding-bottom: 14px; margin-bottom: 18px; }
    .header-logo { width: 54px; height: 54px; border-radius: 8px; object-fit: contain; flex-shrink: 0; }
    .header-text h1 { font-size: 17px; font-weight: 800; color: #1e3a5f; line-height: 1.2; }
    .header-text p  { font-size: 10.5px; color: #6b7280; margin-top: 2px; }
    .header-meta    { margin-left: auto; text-align: right; font-size: 10px; color: #6b7280; line-height: 1.7; }

    /* Summary strip */
    .summary { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; flex: 1; min-width: 100px; text-align: center; background: #f9fafb; }
    .stat-val  { font-size: 22px; font-weight: 800; line-height: 1; }
    .stat-lbl  { font-size: 9.5px; color: #6b7280; margin-top: 3px; text-transform: uppercase; letter-spacing: .04em; }

    /* Table */
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    thead tr { background: #1e3a5f; color: #fff; }
    thead th { padding: 9px 8px; text-align: left; font-weight: 700; font-size: 10px; letter-spacing: .03em; white-space: nowrap; }
    thead th.center { text-align: center; }
    tbody tr:nth-child(even) { background: #f3f4f6; }
    tbody tr:hover { background: #e0e7ff; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    td.center { text-align: center; }
    td.decision { font-weight: 700; white-space: nowrap; }
    td.notes { color: #6b7280; max-width: 140px; }
    .sub { font-size: 9.5px; color: #9ca3af; }

    /* Footer */
    .footer { margin-top: 22px; border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9.5px; color: #9ca3af; }

    /* Print button (web-only) */
    .print-bar { display: flex; gap: 10px; justify-content: flex-end; margin-bottom: 18px; }
    .print-bar button { padding: 8px 20px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-print  { background: #1e3a5f; color: #fff; }
    .btn-close  { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }

    @media print {
      .print-bar { display: none !important; }
      body { padding: 10px 14px; }
      tbody tr:hover { background: inherit; }
    }

    @page { size: A4 landscape; margin: 14mm 12mm; }
  </style>
</head>
<body>

  <div class="print-bar">
    <button class="btn-close" onclick="window.close()">✕ Close Preview</button>
    <button class="btn-print" onclick="window.print()">🖨 Print / Save as PDF</button>
  </div>

  <div class="header">
    <img class="header-logo" src="__LOGO_URL__" alt="Crawford University" />
    <div class="header-text">
      <h1>Crawford University — Appraisal &amp; Promotion Committee</h1>
      <p>Staff Promotion &amp; Increment Report &nbsp;·&nbsp; Academic Year ${YEAR}</p>
    </div>
    <div class="header-meta">
      <div><strong>Generated:</strong> ${generated}</div>
      <div><strong>Total Records:</strong> ${appraisals.length}</div>
      <div><strong>Classification:</strong> Confidential</div>
    </div>
  </div>

  <div class="summary">
    ${summaryRow('Promoted', counts.promoted || 0, '#15803d')}
    ${summaryRow('Salary Increment', counts.increment || 0, '#1d4ed8')}
    ${summaryRow('Both', counts.both || 0, '#6d28d9')}
    ${summaryRow('Deferred', counts.deferred || 0, '#b45309')}
    ${summaryRow('Not Eligible', counts.not_eligible || 0, '#b91c1c')}
    ${summaryRow('Total', appraisals.length, '#111827')}
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width:32px">S/N</th>
        <th style="min-width:130px">Staff Name / ID</th>
        <th>Department</th>
        <th>College</th>
        <th>Rank</th>
        <th>Category</th>
        <th class="center" style="width:72px">HOD Grade</th>
        <th style="width:120px">A&amp;PC Decision</th>
        <th>Notes</th>
        <th class="center" style="width:72px">Date</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || '<tr><td colspan="10" style="text-align:center;padding:20px;color:#9ca3af">No records found.</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <span>Crawford University Appraisal System &nbsp;·&nbsp; A&amp;PC Committee Report</span>
    <span>Academic Year: ${YEAR} &nbsp;·&nbsp; Generated ${generated}</span>
  </div>

</body>
</html>`;

    const logoUrl = `${window.location.origin}/crawford-logo.png`;
    const htmlWithLogo = html.replace('__LOGO_URL__', logoUrl);
    const win = window.open('', '_blank', 'width=1100,height=780,scrollbars=yes');
    win.document.write(htmlWithLogo);
    win.document.close();
  };

  const summaryStats = [
    { icon: <LuAward size={20} />, label: 'Promoted', value: counts.promoted || 0, color: '#10b981' },
    { icon: <LuCoins size={20} />, label: 'Increment', value: counts.increment || 0, color: '#3b82f6' },
    { icon: <LuClock size={20} />, label: 'Deferred', value: counts.deferred || 0, color: '#f59e0b' },
    { icon: <LuXCircle size={20} />, label: 'Not Eligible', value: counts.not_eligible || 0, color: '#ef4444' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">A&PC Reports</h1>
        <p className="page-subtitle">Promotion and increment statistics for the {YEAR} appraisal cycle.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {summaryStats.map((s, i) => (
          <div key={i} className="card-stat">
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Decision Breakdown</h3>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</div>
          ) : appraisals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No decisions recorded yet.</p>
          ) : (
            Object.entries(counts).map(([decision, count]) => {
              const pct = Math.round((count / appraisals.length) * 100);
              const colors = { promoted: '#10b981', increment: '#3b82f6', deferred: '#f59e0b', not_eligible: '#ef4444' };
              return (
                <div key={decision} style={{ marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {decision.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: colors[decision] || 'var(--text-primary)' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colors[decision] || 'var(--primary)', borderRadius: '3px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Grade Distribution</h3>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</div>
          ) : Object.keys(gradeDistribution).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No grade data available.</p>
          ) : (
            ['A', 'B', 'C', 'D', 'E'].filter(g => gradeDistribution[g]).map(grade => {
              const count = gradeDistribution[grade] || 0;
              const total = appraisals.length;
              const pct = total ? Math.round((count / total) * 100) : 0;
              const gradeColors = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', E: '#ef4444' };
              return (
                <div key={grade} style={{ marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Grade {grade}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: gradeColors[grade] }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: gradeColors[grade], borderRadius: '3px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>All Decisions — {YEAR}</h3>
          {appraisals.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handlePrint} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LuPrinter size={15} /> Print
              </button>
              <button onClick={handleExportExcel} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LuFileSpreadsheet size={15} /> Export Excel
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : appraisals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No report data yet</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Decisions recorded on the Eligible Staff page will populate this report.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Staff Name</th><th>Department</th><th>Category</th><th>Grade</th><th>Decision</th><th>Date</th></tr>
              </thead>
              <tbody>
                {appraisals.map(a => {
                  const d = a.apc_decision?.decision;
                  const badgeMap = { promoted: 'badge-success', increment: 'badge-info', deferred: 'badge-warning', not_eligible: 'badge-danger' };
                  return (
                    <tr key={a.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.users?.full_name || '—'}</td>
                      <td>{a.users?.department || '—'}</td>
                      <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{(a.users?.staff_category || a.staff_category || '—').replace(/_/g, ' ')}</span></td>
                      <td><span className="badge badge-primary">{a.hod_grades?.overallGrade || '—'}</span></td>
                      <td><span className={`badge ${badgeMap[d] || 'badge-info'}`} style={{ textTransform: 'capitalize' }}>{d?.replace('_', ' ') || '—'}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {a.apc_decision?.decided_at ? new Date(a.apc_decision.decided_at).toLocaleDateString('en-NG') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default APCReportsPage;
