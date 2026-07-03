import { useState, useEffect } from 'react';
import { LuClipboardList, LuCheckCircle2, LuClock, LuScale } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { getCollegeOverview } from '../../services/appraisalService';

const CollegeOverviewPage = () => {
  const { userProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCollegeOverview()
      .then(setData)
      .catch(err => console.error('College overview error:', err))
      .finally(() => setLoading(false));
  }, []);

  const totals = data?.totals || {};
  const departments = data?.departments || [];

  const stats = [
    { icon: <LuClipboardList size={20} />, label: 'Total Staff', value: loading ? '…' : (totals.total_staff ?? 0), color: '#3b82f6' },
    { icon: <LuCheckCircle2 size={20} />, label: 'Submitted', value: loading ? '…' : (totals.submitted ?? 0), color: '#10b981' },
    { icon: <LuClock size={20} />, label: 'Pending Submission', value: loading ? '…' : (totals.pending ?? 0), color: '#f59e0b' },
    { icon: <LuScale size={20} />, label: 'Invalidations', value: loading ? '…' : (totals.disputed ?? 0), color: '#ef4444' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">College Overview</h1>
        <p className="page-subtitle">
          Appraisal completion rates and department summaries
          {userProfile?.college ? ` — ${userProfile.college}` : ''}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="card-stat">
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          Department Breakdown
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No department data yet</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              College-wide data will appear once staff begin submitting appraisal forms.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th style={{ textAlign: 'center' }}>Staff</th>
                  <th style={{ textAlign: 'center' }}>Submitted</th>
                  <th style={{ textAlign: 'center' }}>Pending</th>
                  <th style={{ textAlign: 'center' }}>Invalidations</th>
                  <th style={{ textAlign: 'center' }}>Completion</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d, i) => {
                  const pct = d.staff > 0 ? Math.round((d.submitted / d.staff) * 100) : 0;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{d.name}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{d.staff}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{d.submitted}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: d.pending > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: d.pending > 0 ? 600 : 400 }}>
                          {d.pending}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {d.disputed > 0 ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>{d.disputed}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                          <div style={{
                            width: 60, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${pct}%`, height: '100%', borderRadius: 3,
                              background: pct === 100 ? '#10b981' : pct > 50 ? '#3b82f6' : '#f59e0b',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: 30 }}>
                            {pct}%
                          </span>
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

export default CollegeOverviewPage;
