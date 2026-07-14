import { useState, useEffect } from 'react';
import { getDeanSubmissions, submitDeanAssessment } from '../../services/appraisalService';

const YEAR = '2025/2026';

const GRADES = ['A', 'B', 'C', 'D', 'E'];
const GRADE_LABELS = { A: 'Very Good', B: 'Good', C: 'Satisfactory', D: 'Fair', E: 'Poor' };

const CRITERIA = [
  { key: 'qualityOfTeaching', label: 'Quality of Teaching / Leadership' },
  { key: 'departmentResponsibilities', label: "Dean's College Responsibilities" },
  { key: 'contributionToUniversity', label: 'Contribution to University/Community' },
  { key: 'serviceToProfession', label: 'Service to the Profession' },
  { key: 'research', label: 'Research & Publications' },
  { key: 'otherDepartmentResponsibilities', label: 'Administrative Responsibilities' },
  { key: 'contributionToCountry', label: 'Contributions to University/Community/Country' },
];

const STATUS_BADGES = {
  submitted:       { label: 'Awaiting Assessment', badge: 'badge-warning' },
  assessed:        { label: 'Assessed', badge: 'badge-success' },
  hod_assessed:    { label: 'Assessed', badge: 'badge-success' },
  registry_assessed: { label: 'Assessed', badge: 'badge-success' },
  disputed:        { label: 'Invalidated', badge: 'badge-danger' },
  dispute_raised:  { label: 'Invalidation Raised', badge: 'badge-danger' },
  dean_resolved:   { label: 'Resolved', badge: 'badge-primary' },
};

const VCAssessDeansPage = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [grades, setGrades] = useState({});
  const [overallGrade, setOverallGrade] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDeanSubmissions(YEAR)
      .then(setAppraisals)
      .catch(() => setAppraisals([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (appraisal) => {
    setSelected(appraisal);
    const existing = appraisal.hodAssessment || {};
    setGrades(existing.grades || {});
    setOverallGrade(existing.overallGrade || '');
    setRecommendation(existing.recommendation || appraisal.hodRecommendation || '');
    setError('');
    setSuccessId(null);
  };

  const setGrade = (key, grade) => setGrades(prev => ({ ...prev, [key]: { grade } }));

  const handleSubmit = async () => {
    if (!overallGrade) { setError('Please select an overall grade.'); return; }
    if (!recommendation.trim()) { setError('Please provide a recommendation.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await submitDeanAssessment(selected.id, {
        grades,
        overallGrade,
        recommendation,
      });
      setSuccessId(selected.id);
      setAppraisals(prev => prev.map(a =>
        a.id === selected.id ? { ...a, status: 'assessed' } : a
      ));
      setSelected(null);
    } catch {
      setError('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header"><h1 className="page-title">Assess Deans</h1></div>
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      </div>
    );
  }

  if (selected) {
    const staff = selected.users || {};
    return (
      <div className="page-container">
        <div className="page-header">
          <button
            onClick={() => setSelected(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', marginBottom: '0.75rem', padding: 0 }}
          >
            ← Back to list
          </button>
          <h1 className="page-title">Assess: {staff.full_name}</h1>
          <p className="page-subtitle">{staff.department} · {staff.college} · {YEAR}</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}><span>{error}</span></div>}
        {successId && <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}><span>Assessment submitted successfully.</span></div>}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Performance Assessment Criteria</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Grade Key: <strong>A</strong> = Very Good · <strong>B</strong> = Good · <strong>C</strong> = Satisfactory · <strong>D</strong> = Fair · <strong>E</strong> = Poor
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {CRITERIA.map(c => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.label}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {GRADES.map(g => (
                    <button
                      key={g}
                      onClick={() => setGrade(c.key, g)}
                      style={{
                        width: 36, height: 36, borderRadius: 8, border: '2px solid',
                        borderColor: grades[c.key]?.grade === g ? 'var(--role-accent)' : 'var(--border)',
                        background: grades[c.key]?.grade === g ? 'var(--role-accent-dim)' : 'transparent',
                        color: grades[c.key]?.grade === g ? 'var(--role-accent)' : 'var(--text-muted)',
                        fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {grades[c.key]?.grade && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 90 }}>
                    {GRADE_LABELS[grades[c.key].grade]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Overall Assessment</h3>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Overall Grade *</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {GRADES.map(g => (
                <button
                  key={g}
                  onClick={() => setOverallGrade(g)}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: 8, border: '2px solid',
                    borderColor: overallGrade === g ? 'var(--role-accent)' : 'var(--border)',
                    background: overallGrade === g ? 'var(--role-accent-dim)' : 'transparent',
                    color: overallGrade === g ? 'var(--role-accent)' : 'var(--text-muted)',
                    fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {g} — {GRADE_LABELS[g]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Recommendation *</label>
            <textarea
              className="form-input"
              rows={4}
              value={recommendation}
              onChange={e => setRecommendation(e.target.value)}
              placeholder="Provide your recommendation for this Dean…"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
        <h1 className="page-title">Assess Deans</h1>
        <p className="page-subtitle">Review and assess Deans who have submitted their appraisal forms for {YEAR}.</p>
      </div>

      {successId && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <span>Assessment submitted successfully.</span>
        </div>
      )}

      {appraisals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No Dean submissions yet</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Deans who submit their appraisal forms will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Dean</th>
                <th>College</th>
                <th>Rank</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appraisals.map(a => {
                const staff = a.users || {};
                const badge = STATUS_BADGES[a.status] || { label: a.status, badge: 'badge-secondary' };
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.full_name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{staff.college || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{staff.current_rank || '—'}</td>
                    <td><span className={`badge ${badge.badge}`}>{badge.label}</span></td>
                    <td>
                      <button onClick={() => handleSelect(a)} className="btn btn-secondary btn-sm">
                        {a.hodAssessment ? 'View / Edit' : 'Assess'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VCAssessDeansPage;
