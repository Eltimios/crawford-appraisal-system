import { useState, useEffect } from 'react';
import { getEligibleAppraisals, recordPromotionDecision } from '../../services/appraisalService';
import { useAuth } from '../../context/AuthContext';

const YEAR = '2025/2026';

const GRADE_COLOR = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', E: '#ef4444' };

const PROMOTION_OPTIONS = [
  { value: 'promoted', label: 'Promote', color: '#10b981' },
  { value: 'increment', label: 'Increment Only', color: '#3b82f6' },
  { value: 'deferred', label: 'Defer Decision', color: '#f59e0b' },
  { value: 'not_eligible', label: 'Not Eligible', color: '#ef4444' },
];

const EligibleStaffPage = () => {
  const { userProfile } = useAuth();
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await getEligibleAppraisals(YEAR);
        setAppraisals(data.filter(a => !a.apcDecision));
      } catch { /* Firebase not configured yet */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDecision = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      await recordPromotionDecision(selected.id, userProfile.id, decision, notes);
      setAppraisals(prev => prev.filter(a => a.id !== selected.id));
      setSuccess('Decision recorded successfully.');
      setSelected(null);
      setDecision('');
      setNotes('');
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const filtered = appraisals.filter(a => {
    if (filter === 'academic') return a.category === 'academic';
    if (filter === 'non-academic') return a.category !== 'academic';
    return true;
  });

  if (selected) {
    const part1 = selected.part1 || {};
    const assessment = selected.hodAssessment || {};
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>← Back</button>
          <h1 className="page-title">Record Decision</h1>
          <p className="page-subtitle">{part1.firstName} {part1.surname} — {part1.department}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Information</h3>
            {[
              ['Full Name', `${part1.surname || ''} ${part1.firstName || ''}`.trim()],
              ['Staff ID', part1.staffId],
              ['Rank', part1.rank],
              ['Department', part1.department],
              ['Category', selected.category],
              ['Qualification', part1.highestQualification],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{val || '—'}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HOD Assessment</h3>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Overall Grade</div>
                <div style={{ fontWeight: 800, fontSize: '2rem', color: GRADE_COLOR[assessment.overallGrade] || 'var(--text-primary)' }}>
                  {assessment.overallGrade || '—'}
                </div>
              </div>
              {assessment.totalScore !== undefined && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Score</div>
                  <div style={{ fontWeight: 800, fontSize: '2rem', color: '#34d399' }}>{assessment.totalScore}</div>
                </div>
              )}
            </div>
            {assessment.recommendation && (
              <div style={{ padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-light)' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>HOD Recommendation</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{assessment.recommendation}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Your Decision</h3>
          <div className="form-group">
            <label className="form-label">Decision <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              {PROMOTION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDecision(opt.value)}
                  style={{
                    padding: '0.875rem', borderRadius: 'var(--radius-sm)', border: '2px solid',
                    borderColor: decision === opt.value ? opt.color : 'var(--border)',
                    background: decision === opt.value ? `${opt.color}22` : 'var(--bg-hover)',
                    color: decision === opt.value ? opt.color : 'var(--text-secondary)',
                    fontWeight: decision === opt.value ? 700 : 500,
                    cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" rows={4} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this decision..." />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button onClick={() => setSelected(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleDecision} disabled={submitting || !decision} className="btn btn-primary">
              {submitting ? 'Saving...' : 'Confirm Decision'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Eligible Staff</h1>
        <p className="page-subtitle">Staff with completed assessments pending A&PC promotion/increment decisions.</p>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}><span>{success}</span></div>}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Pending Decisions
            {filtered.length > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.75rem' }}>{filtered.length}</span>}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'academic', 'non-academic'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No pending decisions</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Staff with completed HOD assessments will appear here.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Staff Name</th><th>Department</th><th>Rank</th><th>Category</th><th>Grade</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.part1?.surname} {a.part1?.firstName}</td>
                    <td>{a.part1?.department || '—'}</td>
                    <td>{a.part1?.rank || '—'}</td>
                    <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{a.category || '—'}</span></td>
                    <td>{a.hodAssessment?.overallGrade
                      ? <span style={{ fontWeight: 800, color: GRADE_COLOR[a.hodAssessment.overallGrade] }}>{a.hodAssessment.overallGrade}</span>
                      : '—'}</td>
                    <td><button onClick={() => setSelected(a)} className="btn btn-primary btn-sm">Decide →</button></td>
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

export default EligibleStaffPage;
