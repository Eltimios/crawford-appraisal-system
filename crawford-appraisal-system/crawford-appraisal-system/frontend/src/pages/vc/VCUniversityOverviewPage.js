import { useState, useEffect } from 'react';
import { LuCheckCircle2, LuClock, LuBuilding2 } from 'react-icons/lu';
import { getDeanSubmissions } from '../../services/appraisalService';

const YEAR = '2025/2026';

const VCUniversityOverviewPage = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeanSubmissions(YEAR)
      .then(setAppraisals)
      .catch(() => setAppraisals([]))
      .finally(() => setLoading(false));
  }, []);

  // Group deans by college
  const collegeMap = {};
  for (const a of appraisals) {
    const college = a.part1?.college || a.users?.college || 'Unknown College';
    if (!collegeMap[college]) collegeMap[college] = { total: 0, assessed: 0, pending: 0 };
    collegeMap[college].total += 1;
    if (a.rawStatus !== 'submitted') {
      collegeMap[college].assessed += 1;
    } else {
      collegeMap[college].pending += 1;
    }
  }
  const colleges = Object.entries(collegeMap).sort(([a], [b]) => a.localeCompare(b));

  const totalDeans = appraisals.length;
  const totalAssessed = appraisals.filter(a => a.rawStatus !== 'submitted').length;
  const totalPending = appraisals.filter(a => a.rawStatus === 'submitted').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">University Overview</h1>
        <p className="page-subtitle">
          Dean appraisal submission and assessment status for {YEAR}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {[
          { icon: <LuBuilding2 size={20} />, label: 'Total Deans', value: loading ? '…' : totalDeans, color: '#3b82f6' },
          { icon: <LuCheckCircle2 size={20} />, label: 'VC Assessed', value: loading ? '…' : totalAssessed, color: '#10b981' },
          { icon: <LuClock size={20} />, label: 'Awaiting Assessment', value: loading ? '…' : totalPending, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="card-stat">
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          College Breakdown
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : colleges.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No Dean submissions yet</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>College</th>
                  <th>Total Deans</th>
                  <th>Assessed</th>
                  <th>Pending</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {colleges.map(([college, stats]) => {
                  const pct = stats.total > 0 ? Math.round((stats.assessed / stats.total) * 100) : 0;
                  return (
                    <tr key={college}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{college}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{stats.total}</td>
                      <td>
                        <span className="badge badge-success">{stats.assessed}</span>
                      </td>
                      <td>
                        {stats.pending > 0
                          ? <span className="badge badge-warning">{stats.pending}</span>
                          : <span className="badge badge-success">0</span>
                        }
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10b981' : '#3b82f6', borderRadius: 4, transition: 'width 0.4s' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 32 }}>{pct}%</span>
                        </div>
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

export default VCUniversityOverviewPage;
