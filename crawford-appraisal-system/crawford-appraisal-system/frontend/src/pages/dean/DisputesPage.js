import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPendingDisputes, resolveDispute } from '../../services/appraisalService';

const YEAR = '2025/2026';

const DisputesPage = () => {
  const { userProfile } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!userProfile?.college) return;
    (async () => {
      try {
        const data = await getPendingDisputes(userProfile.college, YEAR);
        setDisputes(data);
      } catch { /* Firebase not configured yet */ }
      finally { setLoading(false); }
    })();
  }, [userProfile]);

  const handleResolve = async () => {
    if (!resolution.trim()) return;
    setSubmitting(true);
    try {
      await resolveDispute(selected.id, userProfile.id, resolution);
      setDisputes(prev => prev.filter(d => d.id !== selected.id));
      setSuccess('Invalidation resolved successfully.');
      setSelected(null);
      setResolution('');
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  if (selected) {
    const part1 = selected.part1 || {};
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>← Back</button>
          <h1 className="page-title">Resolve Invalidation</h1>
          <p className="page-subtitle">{part1.firstName} {part1.surname} — {part1.department}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HOD Assessment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              <strong>Overall Grade:</strong> {selected.hodAssessment?.overallGrade || '—'}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <strong>Recommendation:</strong><br />{selected.hodAssessment?.recommendation || '—'}
            </p>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Invalidation Comment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {selected.staffDispute?.comment || '—'}
            </p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Your Resolution</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Review both the HOD assessment and the staff's invalidation comment, then provide your final decision.
          </p>
          <div className="form-group">
            <label className="form-label">Final Resolution <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              className="form-input" rows={6}
              value={resolution} onChange={e => setResolution(e.target.value)}
              placeholder="State your final decision on this invalidation, considering both the HOD assessment and the staff's comment..."
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setSelected(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleResolve} disabled={submitting || !resolution.trim()} className="btn btn-primary">
              {submitting ? 'Submitting...' : 'Submit Resolution'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Invalidations</h1>
        <p className="page-subtitle">Review and resolve assessment invalidations raised by staff in your college.</p>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}><span>{success}</span></div>}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Pending Invalidations
            {disputes.length > 0 && <span className="badge badge-danger" style={{ marginLeft: '0.75rem' }}>{disputes.length}</span>}
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : disputes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No active invalidations</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Invalidations raised by staff will appear here for your resolution.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Staff Name</th><th>Department</th><th>HOD Grade</th><th>Submitted On</th><th>Action</th></tr>
              </thead>
              <tbody>
                {disputes.map(d => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{d.part1?.surname} {d.part1?.firstName}</td>
                    <td>{d.part1?.department || '—'}</td>
                    <td>{d.hodAssessment?.overallGrade ? <span className="badge badge-primary">{d.hodAssessment.overallGrade}</span> : '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.staffDispute?.submittedAt ? new Date(d.staffDispute.submittedAt).toLocaleDateString('en-NG') : '—'}</td>
                    <td><button onClick={() => setSelected(d)} className="btn btn-warning btn-sm">Resolve →</button></td>
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

export default DisputesPage;
