import { useState, useEffect } from 'react';
import api from '../../services/api';

const YEAR = '2025/2026';

const GRADES = ['A', 'B', 'C', 'D', 'E'];
const GRADE_LABELS = { A: 'Very Good', B: 'Good', C: 'Satisfactory', D: 'Fair', E: 'Poor' };

const CRITERIA = [
  { key: 'supervisorySkills', label: 'Supervisory Skills' },
  { key: 'qualityOfReports', label: 'Quality of Reports Submitted' },
  { key: 'punctuality', label: 'Punctuality & Attendance' },
  { key: 'staffRelations', label: 'Staff Relations' },
  { key: 'jobKnowledge', label: 'Job Knowledge' },
  { key: 'initiative', label: 'Initiative & Resourcefulness' },
  { key: 'integrity', label: 'Integrity & Conduct' },
];

const STATUS_BADGES = {
  submitted: { label: 'Awaiting Assessment', badge: 'badge-warning' },
  assessed: { label: 'Assessed', badge: 'badge-success' },
  registry_assessed: { label: 'Assessed by Registry', badge: 'badge-success' },
  disputed: { label: 'Disputed', badge: 'badge-danger' },
};

const RegistryAssessROPage = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [grades, setGrades] = useState({});
  const [overallGrade, setOverallGrade] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/registry/reporting-officers', { params: { year: YEAR } })
      .then(res => setAppraisals(res.data.appraisals || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const initGrades = () => CRITERIA.reduce((acc, c) => ({ ...acc, [c.key]: '' }), {});

  const openAssessment = (appraisal) => {
    setSelected(appraisal);
    setGrades(initGrades());
    setOverallGrade('');
    setRecommendation('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    if (!overallGrade) { setError('Please select an overall grade.'); return; }
    if (!recommendation.trim()) { setError('Please provide a written recommendation.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/registry/assess-ro/${selected.id}`, {
        grades, overallGrade, recommendation,
      });
      setAppraisals(prev => prev.map(a =>
        a.id === selected.id ? { ...a, status: 'registry_assessed' } : a
      ));
      setSuccess('Assessment submitted successfully.');
      setTimeout(() => { setSelected(null); setSuccess(''); }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = appraisals.filter(a => a.status === 'submitted');
  const completed = appraisals.filter(a => a.status !== 'submitted');

  if (selected) {
    const u = selected.users || {};
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
            ← Back to Queue
          </button>
          <h1 className="page-title">Assess Reporting Officer — {u.full_name}</h1>
          <p className="page-subtitle">{u.department} · {YEAR}</p>
        </div>

        {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}><span>{success}</span></div>}
        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}><span>{error}</span></div>}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Officer Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Full Name', value: u.full_name || '—' },
              { label: 'Staff ID', value: u.staff_id || '—' },
              { label: 'Department', value: u.department || '—' },
              { label: 'Grade Level', value: u.current_rank || '—' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Performance Assessment</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Grade Key: <strong>A</strong> = Very Good · <strong>B</strong> = Good · <strong>C</strong> = Satisfactory · <strong>D</strong> = Fair · <strong>E</strong> = Poor
          </p>
          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60%' }}>Assessment Criterion</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {CRITERIA.map(c => (
                  <tr key={c.key}>
                    <td style={{ color: 'var(--text-primary)' }}>{c.label}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {GRADES.map(g => (
                          <button key={g} type="button"
                            onClick={() => setGrades(prev => ({ ...prev, [c.key]: g }))}
                            title={GRADE_LABELS[g]}
                            style={{
                              width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${grades[c.key] === g ? 'var(--primary-light)' : 'var(--border)'}`,
                              background: grades[c.key] === g ? 'rgba(59,130,246,0.2)' : 'transparent',
                              color: grades[c.key] === g ? 'var(--primary-light)' : 'var(--text-muted)',
                              fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                            }}
                          >{g}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-group">
            <label className="form-label">Overall Grade <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {GRADES.map(g => (
                <button key={g} type="button"
                  onClick={() => setOverallGrade(g)}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 700,
                    border: `1px solid ${overallGrade === g ? 'var(--primary-light)' : 'var(--border)'}`,
                    background: overallGrade === g ? 'rgba(59,130,246,0.15)' : 'var(--bg-hover)',
                    color: overallGrade === g ? 'var(--primary-light)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >{g} — {GRADE_LABELS[g]}</button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Written Recommendation / Remarks <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea className="form-input" rows={5} value={recommendation}
              onChange={e => setRecommendation(e.target.value)}
              placeholder="Provide your assessment and recommendations for this Reporting Officer..." />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={() => setSelected(null)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
            {submitting ? 'Submitting…' : 'Submit Assessment'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Assess Reporting Officers</h1>
        <p className="page-subtitle">Review and grade Reporting Officers who have submitted their appraisal forms.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Pending Assessments
            {pending.length > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.75rem' }}>{pending.length}</span>}
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : pending.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No pending assessments</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Reporting Officers who submit their appraisal forms will appear here.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Staff ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(a => {
                  const u = a.users || {};
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.full_name || '—'}</td>
                      <td>{u.department || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.staff_id || '—'}</td>
                      <td>
                        <button onClick={() => openAssessment(a)} className="btn btn-primary btn-sm">Assess →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Completed Assessments
            <span className="badge badge-success" style={{ marginLeft: '0.75rem' }}>{completed.length}</span>
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Name</th><th>Department</th><th>Status</th></tr>
              </thead>
              <tbody>
                {completed.map(a => {
                  const u = a.users || {};
                  const cfg = STATUS_BADGES[a.status] || STATUS_BADGES.assessed;
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.full_name || '—'}</td>
                      <td>{u.department || '—'}</td>
                      <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistryAssessROPage;
