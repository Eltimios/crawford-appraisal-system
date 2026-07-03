import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDeanCollegeBoardQueue, submitCollegeBoardReview } from '../../services/appraisalService';
import { LuCheckCircle2, LuClock, LuMessageSquare, LuX } from 'react-icons/lu';

const YEAR = '2025/2026';

const GRADE_LABELS = { A: 'Very Good', B: 'Good', C: 'Satisfactory', D: 'Fair', E: 'Poor' };

const ACADEMIC_CRITERIA = [
  { key: 'qualityOfTeaching', label: 'Quality of Teaching' },
  { key: 'departmentResponsibilities', label: "Department Responsibilities" },
  { key: 'contributionToUniversity', label: 'Contribution to University/Community' },
  { key: 'serviceToProfession', label: 'Service to the Profession' },
  { key: 'research', label: 'Research' },
  { key: 'otherDepartmentResponsibilities', label: 'Other Department Responsibilities' },
  { key: 'contributionToCountry', label: 'Contribution to Country' },
];

const RECOMMENDATIONS = [
  { value: 'promote',    label: 'Recommend for Promotion' },
  { value: 'increment',  label: 'Recommend for Increment' },
  { value: 'both',       label: 'Recommend for Both (Promotion & Increment)' },
  { value: 'commend',    label: 'Commend — No Promotion/Increment' },
  { value: 'no_action',  label: 'No Action' },
];

const STATUS_LABELS = {
  hod_assessed:   { label: 'Pending Staff View', badge: 'badge-warning' },
  staff_viewed:   { label: 'Staff Accepted',     badge: 'badge-success' },
  dispute_raised: { label: 'Staff Commented',    badge: 'badge-info' },
  dean_resolved:  { label: 'Comment Resolved',   badge: 'badge-success' },
};

const CollegeReviewPage = () => {
  const { userProfile } = useAuth();
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDeanCollegeBoardQueue()
      .then(setAppraisals)
      .catch(() => setAppraisals([]))
      .finally(() => setLoading(false));
  }, []);

  const openReview = (a) => {
    setSelected(a);
    setRecommendation('');
    setNotes('');
    setError('');
  };

  const closeModal = () => {
    setSelected(null);
    setRecommendation('');
    setNotes('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!recommendation) { setError('Please select a recommendation.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await submitCollegeBoardReview(selected.id, recommendation, notes);
      setAppraisals(prev => prev.filter(a => a.id !== selected.id));
      setSuccessId(selected.id);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = appraisals.filter(a => a.rawStatus === 'hod_assessed').length;
  const staffViewed = appraisals.filter(a => ['staff_viewed', 'dispute_raised', 'dean_resolved'].includes(a.rawStatus)).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">College Board Review</h1>
        <p className="page-subtitle">
          Review HOD-assessed appraisals and submit college board recommendations for A&PC — {YEAR}.
        </p>
      </div>

      {successId && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          College Board review submitted successfully. A&PC has been notified.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card-stat">
          <div className="stat-icon" style={{ background: '#f59e0b22', color: '#f59e0b' }}><LuClock size={20} /></div>
          <div><div className="stat-value">{loading ? '…' : pending}</div><div className="stat-label">Pending Staff View</div></div>
        </div>
        <div className="card-stat">
          <div className="stat-icon" style={{ background: '#3b82f622', color: '#3b82f6' }}><LuMessageSquare size={20} /></div>
          <div><div className="stat-value">{loading ? '…' : staffViewed}</div><div className="stat-label">Staff Responded</div></div>
        </div>
        <div className="card-stat">
          <div className="stat-icon" style={{ background: '#10b98122', color: '#10b981' }}><LuCheckCircle2 size={20} /></div>
          <div><div className="stat-value">{loading ? '…' : appraisals.length}</div><div className="stat-label">Awaiting CB Review</div></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          Appraisals Awaiting College Board Review
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : appraisals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><LuCheckCircle2 size={32} /></div>
            <div className="empty-state-title">All reviewed</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              No appraisals are currently awaiting College Board review.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Department</th>
                  <th>HOD Grade</th>
                  <th>Staff Response</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appraisals.map(a => {
                  const statusInfo = STATUS_LABELS[a.rawStatus] || { label: a.rawStatus, badge: 'badge-secondary' };
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {a.part1?.surname} {a.part1?.firstName}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{a.part1?.rank || '—'}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{a.part1?.department || '—'}</td>
                      <td>
                        {a.hodAssessment?.overallGrade ? (
                          <span className="badge badge-primary">
                            {a.hodAssessment.overallGrade} — {GRADE_LABELS[a.hodAssessment.overallGrade]}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td><span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span></td>
                      <td>
                        <button onClick={() => openReview(a)} className="btn btn-primary btn-sm">
                          Review →
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

      {/* Review Modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
            width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                  College Board Review
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {selected.part1?.surname} {selected.part1?.firstName} — {selected.part1?.department}
                </p>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <LuX size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* HOD Assessment Summary */}
              {selected.hodAssessment && (
                <div>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                    HOD Assessment
                  </h4>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Criterion</th>
                          <th>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ACADEMIC_CRITERIA.map(c => (
                          selected.hodAssessment[c.key]?.grade ? (
                            <tr key={c.key}>
                              <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.label}</td>
                              <td>
                                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                  {selected.hodAssessment[c.key].grade} — {GRADE_LABELS[selected.hodAssessment[c.key].grade]}
                                </span>
                              </td>
                            </tr>
                          ) : null
                        ))}
                        {selected.hodAssessment.overallGrade && (
                          <tr style={{ background: 'var(--bg-hover)' }}>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Overall Grade</td>
                            <td>
                              <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                                {selected.hodAssessment.overallGrade} — {GRADE_LABELS[selected.hodAssessment.overallGrade]}
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {selected.hodAssessment.recommendation && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-light)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        HOD Recommendation
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{selected.hodAssessment.recommendation}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Staff Response */}
              {['staff_viewed', 'dispute_raised', 'dean_resolved'].includes(selected.rawStatus) && (
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Staff Response
                  </div>
                  {selected.rawStatus === 'staff_viewed' && (
                    <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>Staff accepted this assessment.</div>
                  )}
                  {selected.rawStatus === 'dispute_raised' && (
                    <>
                      <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Staff submitted an invalidation comment:</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{selected.staffComment || selected.staffDispute?.comment || '—'}</div>
                    </>
                  )}
                  {selected.rawStatus === 'dean_resolved' && selected.deanResolution && (
                    <>
                      <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Invalidation resolved by Dean:</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{selected.deanResolution.resolution}</div>
                    </>
                  )}
                </div>
              )}

              {/* College Board Decision */}
              <div>
                <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  College Board Recommendation
                </h4>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Recommendation *</label>
                  <select
                    className="form-input"
                    value={recommendation}
                    onChange={e => { setRecommendation(e.target.value); setError(''); }}
                  >
                    <option value="">— Select a recommendation —</option>
                    {RECOMMENDATIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dean's Notes (optional)</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add any remarks or justification for A&PC..."
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-error">{error}</div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={closeModal} className="btn btn-secondary btn-sm" disabled={submitting}>Cancel</button>
                <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={submitting || !recommendation}>
                  {submitting ? 'Submitting…' : 'Submit to A&PC →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeReviewPage;
