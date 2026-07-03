import { useState, useEffect } from 'react';
import { LuAward, LuClipboardList, LuBookmark } from 'react-icons/lu';
import { getDecidedAppraisals } from '../../services/appraisalService';

const YEAR = '2025/2026';

const PromotionsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDecidedAppraisals(YEAR, 'promoted');
        setRecords(data);
      } catch (err) { console.error('Promotions fetch error:', err); }
      finally { setLoading(false); }
    })();
  }, []);

  const stats = [
    { icon: <LuAward size={20} />, label: 'Promotions This Cycle', value: records.length, color: '#10b981' },
    { icon: <LuClipboardList size={20} />, label: 'Academic Staff', value: records.filter(r => r.category === 'academic').length, color: '#3b82f6' },
    { icon: <LuBookmark size={20} />, label: 'Non-Academic Staff', value: records.filter(r => r.category !== 'academic').length, color: '#8b5cf6' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Promotions</h1>
        <p className="page-subtitle">Staff promoted during the {YEAR} appraisal cycle.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="card-stat">
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          Promotion Records
          {records.length > 0 && <span className="badge badge-success" style={{ marginLeft: '0.75rem' }}>{records.length}</span>}
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No promotions recorded</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Promotion decisions made on the Eligible Staff page will appear here.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Staff Name</th><th>Department</th><th>Grade Level</th><th>Category</th><th>HOD Grade</th><th>Decision Date</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.part1?.surname} {r.part1?.firstName}</td>
                    <td>{r.part1?.department || '—'}</td>
                    <td>{r.part1?.rank || '—'}</td>
                    <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{r.category || '—'}</span></td>
                    <td><span className="badge badge-primary">{r.hodAssessment?.overallGrade || '—'}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {r.apcDecision?.decidedAt ? new Date(r.apcDecision.decidedAt).toLocaleDateString('en-NG') : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                      {r.apcDecision?.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsPage;
