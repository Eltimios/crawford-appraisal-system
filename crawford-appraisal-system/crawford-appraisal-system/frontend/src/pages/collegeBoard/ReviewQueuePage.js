import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPendingCollegeBoardReviews, collegeBoardApprove, collegeBoardFlag } from '../../services/appraisalService';

const YEAR = '2025/2026';

const GRADE_LABELS = { A: 'Very Good', B: 'Good', C: 'Satisfactory', D: 'Fair', E: 'Poor' };

const ReviewQueuePage = () => {
  const { userProfile } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getPendingCollegeBoardReviews(YEAR);
        setQueue(data);
      } catch { /* Firebase not configured yet */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDecision = async (decision) => {
    setSubmitting(true);
    try {
      if (decision === 'approve') {
        await collegeBoardApprove(selected.id, userProfile.id, notes);
      } else {
        await collegeBoardFlag(selected.id, userProfile.id, notes);
      }
      setQueue(prev => prev.filter(q => q.id !== selected.id));
      setSuccess(`Assessment ${decision === 'approve' ? 'approved' : 'flagged'} successfully.`);
      setSelected(null);
      setNotes('');
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  if (selected) {
    const part1 = selected.part1 || {};
    const assessment = selected.hodAssessment || {};

    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>← Back to Queue</button>
          <h1 className="page-title">Review Assessment</h1>
          <p className="page-subtitle">{part1.firstName} {part1.surname} — {part1.department} — Academic Staff</p>
        </div>

        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          
          <span>Review this HOD/HOU assessment for academic staff. You may approve it (releasing it to the staff member) or flag it for further review. You cannot modify the assessment.</span>
        </div>

        {/* Staff info */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Staff Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Full Name', value: `${part1.surname || ''} ${part1.firstName || ''}`.trim() || '—' },
              { label: 'Staff ID', value: part1.staffId || '—' },
              { label: 'Rank', value: part1.rank || '—' },
              { label: 'Department', value: part1.department || '—' },
              { label: 'Highest Qualification', value: part1.highestQualification || '—' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HOD Assessment */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>HOD Assessment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {Object.entries(assessment).filter(([k]) => !['overallGrade','recommendation','totalScore','submittedAt'].includes(k)).map(([key, val]) => (
              <div key={key} style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', padding: '0.875rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {val?.grade && <span className="badge badge-primary">{val.grade} — {GRADE_LABELS[val.grade]}</span>}
                  {val?.score !== undefined && !val?.grade && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Score: {val.score} / 5</span>}
                  {typeof val === 'string' && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{val}</span>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Overall Grade: </span>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#60a5fa' }}>{assessment.overallGrade || '—'}</span>
            </div>
            {assessment.totalScore !== undefined && (
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Score: </span>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#34d399' }}>{assessment.totalScore}</span>
              </div>
            )}
          </div>
          {assessment.recommendation && (
            <div style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary-light)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>HOD Recommendation</p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{assessment.recommendation}</p>
            </div>
          )}
        </div>

        {/* Decision */}
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Your Decision</h3>
          <div className="form-group">
            <label className="form-label">Review Notes (optional)</label>
            <textarea className="form-input" rows={4} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes about your review decision..." />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button onClick={() => handleDecision('approve')} disabled={submitting} className="btn btn-success">
              Approve — Release to Staff
            </button>
            <button onClick={() => handleDecision('flag')} disabled={submitting} className="btn btn-danger">
              Flag for Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Review Queue</h1>
        <p className="page-subtitle">Academic staff assessments pending College Board review before release.</p>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}><span>{success}</span></div>}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Pending Reviews
            {queue.length > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.75rem' }}>{queue.length}</span>}
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : queue.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">Queue is empty</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Academic staff assessments submitted by HODs will appear here for review.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Staff Name</th><th>Department</th><th>Rank</th><th>HOD Grade</th><th>Submitted</th><th>Action</th></tr>
              </thead>
              <tbody>
                {queue.map(q => (
                  <tr key={q.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{q.part1?.surname} {q.part1?.firstName}</td>
                    <td>{q.part1?.department || '—'}</td>
                    <td>{q.part1?.rank || '—'}</td>
                    <td>{q.hodAssessment?.overallGrade ? <span className="badge badge-primary">{q.hodAssessment.overallGrade}</span> : '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.hodAssessment?.submittedAt ? new Date(q.hodAssessment.submittedAt).toLocaleDateString('en-NG') : '—'}</td>
                    <td><button onClick={() => setSelected(q)} className="btn btn-primary btn-sm">Review →</button></td>
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

export default ReviewQueuePage;
