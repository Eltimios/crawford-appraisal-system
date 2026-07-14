import { useState, useEffect } from 'react';
import { LuClipboardList, LuCheckCircle2, LuClock, LuScale } from 'react-icons/lu';
import { getAllAppraisals } from '../../services/appraisalService';

const YEAR = '2025/2026';

const STATUS_LABELS = {
  draft: { label: 'Draft', color: '#6b7280' },
  submitted: { label: 'Submitted', color: '#3b82f6' },
  assessed: { label: 'Assessed', color: '#f59e0b' },
  viewed: { label: 'Viewed', color: '#8b5cf6' },
  disputed: { label: 'Disputed', color: '#ef4444' },
  resolved: { label: 'Resolved', color: '#10b981' },
  promoted: { label: 'Promoted', color: '#10b981' },
  increment: { label: 'Increment', color: '#3b82f6' },
};

const AdminReportsPage = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllAppraisals(YEAR);
        setAppraisals(data);
      } catch { /* Firebase not configured yet */ }
      finally { setLoading(false); }
    })();
  }, []);

  const statusCounts = appraisals.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const categoryCounts = appraisals.reduce((acc, a) => {
    acc[a.category || 'unknown'] = (acc[a.category || 'unknown'] || 0) + 1;
    return acc;
  }, {});

  const deptCounts = appraisals.reduce((acc, a) => {
    const dept = a.part1?.department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const topDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const handleExportCSV = () => {
    const rows = [
      ['Staff Name', 'Staff ID', 'Department', 'Category', 'Status', 'HOD Grade', 'APC Decision'],
      ...appraisals.map(a => [
        `${a.part1?.surname || ''} ${a.part1?.firstName || ''}`.trim(),
        a.part1?.staffId || '',
        a.part1?.department || '',
        a.category || '',
        a.status || '',
        a.hodAssessment?.overallGrade || '',
        a.apcDecision?.decision || '',
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Appraisal_Report_${YEAR.replace('/', '-')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    { icon: <LuClipboardList size={20} />, label: 'Total Appraisals', value: appraisals.length, color: '#3b82f6' },
    { icon: <LuCheckCircle2 size={20} />, label: 'Completed', value: (statusCounts.resolved || 0) + (statusCounts.promoted || 0) + (statusCounts.increment || 0), color: '#10b981' },
    { icon: <LuClock size={20} />, label: 'In Progress', value: (statusCounts.submitted || 0) + (statusCounts.assessed || 0) + (statusCounts.viewed || 0), color: '#f59e0b' },
    { icon: <LuScale size={20} />, label: 'Disputed', value: statusCounts.disputed || 0, color: '#ef4444' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Reports</h1>
        <p className="page-subtitle">System-wide appraisal statistics for the {YEAR} academic year.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {summaryCards.map((s, i) => (
          <div key={i} className="card-stat">
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Status Breakdown</h3>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</div>
          ) : appraisals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data yet.</p>
          ) : (
            Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
              const meta = STATUS_LABELS[status] || { label: status, color: '#6b7280' };
              const pct = Math.round((count / appraisals.length) * 100);
              return (
                <div key={status} style={{ marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{meta.label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: meta.color }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: '3px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>By Staff Category</h3>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</div>
          ) : Object.keys(categoryCounts).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data yet.</p>
          ) : (
            Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat, count], i) => {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
              const color = colors[i % colors.length];
              const pct = Math.round((count / appraisals.length) * 100);
              return (
                <div key={cat} style={{ marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{cat}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {topDepts.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Top Departments by Submission</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {topDepts.map(([dept, count], i) => {
              const max = topDepts[0][1];
              const pct = Math.round((count / max) * 100);
              return (
                <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '24px', textAlign: 'right' }}>{i + 1}.</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: '220px' }}>{dept}</span>
                  <div style={{ flex: 1, height: '8px', background: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6', borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', minWidth: '30px' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Full Appraisal List — {YEAR}</h3>
          {appraisals.length > 0 && (
            <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">⬇ Export CSV</button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : appraisals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No appraisals recorded</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Appraisal data will populate here as staff submit their forms.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Staff Name</th><th>Department</th><th>Category</th><th>Status</th><th>Grade</th><th>APC Decision</th></tr>
              </thead>
              <tbody>
                {appraisals.map(a => {
                  const meta = STATUS_LABELS[a.status] || { label: a.status, color: '#6b7280' };
                  return (
                    <tr key={a.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.part1?.surname} {a.part1?.firstName}</td>
                      <td>{a.part1?.department || '—'}</td>
                      <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{a.category || '—'}</span></td>
                      <td><span className="badge" style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44` }}>{meta.label}</span></td>
                      <td>{a.hodAssessment?.overallGrade ? <span className="badge badge-primary">{a.hodAssessment.overallGrade}</span> : '—'}</td>
                      <td>{a.apcDecision?.decision
                        ? <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>{a.apcDecision.decision.replace('_', ' ')}</span>
                        : '—'}</td>
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

export default AdminReportsPage;
