import { useState, useEffect } from 'react';
import { getHODSubmissions, submitDeanAssessment } from '../../services/appraisalService';

const YEAR = '2025/2026';

const GRADES = ['A', 'B', 'C', 'D', 'E'];
const GRADE_LABELS = { A: 'Very Good', B: 'Good', C: 'Satisfactory', D: 'Fair', E: 'Poor' };

const ACADEMIC_CRITERIA = [
  { key: 'qualityOfTeaching', label: 'Quality of Teaching' },
  { key: 'departmentResponsibilities', label: "HOD's own Department Responsibilities" },
  { key: 'contributionToUniversity', label: 'Contribution to University/Community' },
  { key: 'serviceToProfession', label: 'Service to the Profession' },
  { key: 'research', label: 'Research' },
  { key: 'otherDepartmentResponsibilities', label: 'Other Department Responsibilities' },
  { key: 'contributionToCountry', label: 'Contributions to University/Community/Country' },
];

const NON_TEACHING_CRITERIA = [
  { key: 'basicQualification', label: 'Basic Qualification', hint: 'OND=5 · SSCE+English=4 · SSCE 5 credits=3 · SSCE attempt=2 · JSS III=1' },
  { key: 'punctuality', label: 'Punctuality', hint: 'Never absent/late=5 · 20% absence rate=4 · 50%=3 · 70%=2 · Fully absent=1' },
  { key: 'lengthOfService', label: 'Length of Service', hint: '21yr+=5 · 16-20yr=4 · 11-15yr=3 · 6-10yr=2 · <5yr=1' },
  { key: 'resourcefulness', label: 'Resourcefulness', hint: 'Commendation=5 · No query=4 · 1 query=3 · 2 queries=2 · Warning/Suspension=1' },
  { key: 'qualityOfWork', label: 'Quality of Work', hint: 'Excellent=5 · Very good=4 · Good=3 · Fairly good=2 · Low quality=1' },
  { key: 'dressing', label: 'Dressing / Physical Presentation', hint: 'Excellent=5 · Very good=4 · Good=3 · Fair=2 · Poor=1' },
  { key: 'diligence', label: 'Diligence / Attitude to Work', hint: 'Outstanding=5 · Very hardworking=4 · Hardworking=3 · Fairly hardworking=2 · Not hardworking=1' },
  { key: 'foresight', label: 'Foresight / Initiative', hint: 'Very high initiative=5 · High=4 · Moderate=3 · Low=2 · Very passive=1' },
  { key: 'dependability', label: 'Dependability', hint: 'Completely trustworthy=5 · Very dependable=4 · Dependable=3 · Fairly=2 · Not dependable=1' },
  { key: 'trainability', label: 'Trainability', hint: 'Excellent potentials=5 · Very high=4 · High=3 · Fair=2 · Low=1' },
  { key: 'clienteleRelationship', label: 'Clientele Relationship', hint: 'Extremely courteous=5 · Very courteous=4 · Courteous=3 · Fairly courteous=2 · Not courteous=1' },
  { key: 'teamWork', label: 'Team Work', hint: 'Very effective team player=5 · Effective=4 · Fairly=3 · Just a team player=2 · Not a team player=1' },
  { key: 'supportForSystem', label: 'Support for the System', hint: 'Extremely committed=5 · Highly committed=4 · Committed=3 · Fairly committed=2 · Not committed=1' },
  { key: 'effectiveness', label: 'Effectiveness', hint: 'Greatly effective=5 · Very effective=4 · Just effective=3 · Not quite effective=2 · Not effective=1' },
  { key: 'serviceability', label: 'Serviceability', hint: 'Extremely serviceable=5 · Very serviceable=4 · Serviceable=3 · Just serviceable=2 · Not serviceable=1' },
];

const SUMMARY_OPTIONS = [
  'Very Effective', 'Effective', 'Fairly Effective', 'Perform Duty Moderately', 'Definitely Ineffective',
];

const RECOMMENDED_ACTIONS = [
  'Confirmation of Appointment', 'Promotion', 'Degrading', 'Conversion', 'Commendation',
  'Annual Increment', 'Annual Increment with Warning', 'Increment to be deferred',
  'Increment to be withheld', 'Termination of Appointment / Dismissal',
];

const STATUS_BADGES = {
  submitted: { label: 'Awaiting Assessment', badge: 'badge-warning' },
  assessed: { label: 'Assessed', badge: 'badge-success' },
  hod_assessed: { label: 'Assessed', badge: 'badge-success' },
  college_board_reviewing: { label: 'CB Reviewing', badge: 'badge-primary' },
  college_board_approved: { label: 'CB Approved', badge: 'badge-success' },
  disputed: { label: 'Disputed', badge: 'badge-danger' },
  completed: { label: 'Completed', badge: 'badge-success' },
};

const initGrades = (category) => {
  if (category === 'academic') {
    return ACADEMIC_CRITERIA.reduce((acc, c) => ({ ...acc, [c.key]: { grade: '' } }), {});
  }
  return NON_TEACHING_CRITERIA.reduce((acc, c) => ({ ...acc, [c.key]: { score: '' } }), {});
};

const AssessHODsPage = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [grades, setGrades] = useState({});
  const [recommendation, setRecommendation] = useState('');
  const [overallGrade, setOverallGrade] = useState('');
  const [summaryAssessment, setSummaryAssessment] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getHODSubmissions(YEAR);
        setAppraisals(data);
      } catch (err) {
        console.error('AssessHODs fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openAssessment = (appraisal) => {
    setSelected(appraisal);
    setGrades(initGrades(appraisal.category));
    setRecommendation('');
    setOverallGrade('');
    setSummaryAssessment('');
    setRecommendedAction('');
    setSuccess('');
    setError('');
  };

  const setAcademicGrade = (key, val) => setGrades(prev => ({ ...prev, [key]: { grade: val } }));
  const setNonTeachingScore = (key, val) => setGrades(prev => ({ ...prev, [key]: { score: val } }));

  const totalNonTeachingScore = !selected || selected.category === 'academic'
    ? 0
    : Object.values(grades).reduce((sum, g) => sum + (parseInt(g.score) || 0), 0);

  const handleSubmit = async () => {
    const isAcademic = selected.category === 'academic';
    if (isAcademic && !overallGrade) { setError('Please select an overall grade.'); return; }
    if (!isAcademic && !summaryAssessment) { setError('Please select a summary assessment.'); return; }
    if (!recommendation.trim()) { setError('Please provide a written recommendation.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const assessment = isAcademic
        ? { ...grades, overallGrade, recommendation }
        : { ...grades, totalScore: totalNonTeachingScore, summaryAssessment, recommendedAction, recommendation };
      await submitDeanAssessment(selected.id, assessment);
      setAppraisals(prev => prev.map(a =>
        a.id === selected.id ? { ...a, status: 'assessed' } : a
      ));
      setSuccess('Assessment submitted successfully.');
      setTimeout(() => { setSelected(null); setSuccess(''); }, 2000);
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = appraisals.filter(a => a.status === 'submitted');
  const completed = appraisals.filter(a => a.status !== 'submitted');

  if (selected) {
    const isAcademic = selected.category === 'academic';
    const part1 = selected.part1 || {};

    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
            ← Back to Queue
          </button>
          <h1 className="page-title">Dean's Assessment — {part1.firstName} {part1.surname}</h1>
          <p className="page-subtitle">
            {isAcademic ? 'Academic HOD/HOU' : 'Non-Teaching HOD/HOU'} · {part1.department} · {YEAR}
          </p>
        </div>

        {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}><span>{success}</span></div>}
        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}><span>{error}</span></div>}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>HOD Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Full Name', value: `${part1.surname} ${part1.firstName} ${part1.otherNames || ''}`.trim() || '—' },
              { label: 'Staff ID', value: part1.staffId || '—' },
              { label: 'Rank / Designation', value: part1.rank || part1.designation || '—' },
              { label: 'Department', value: part1.department || '—' },
              { label: 'Highest Qualification', value: part1.highestQualification || '—' },
              { label: 'Date of First Appointment', value: part1.dateOfFirstAppointment || '—' },
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

          {isAcademic ? (
            <>
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
                    {ACADEMIC_CRITERIA.map(c => (
                      <tr key={c.key}>
                        <td style={{ color: 'var(--text-primary)' }}>{c.label}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            {GRADES.map(g => (
                              <button key={g} type="button"
                                onClick={() => setAcademicGrade(c.key, g)}
                                title={GRADE_LABELS[g]}
                                style={{
                                  width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                                  border: `1px solid ${grades[c.key]?.grade === g ? 'var(--primary-light)' : 'var(--border)'}`,
                                  background: grades[c.key]?.grade === g ? 'rgba(59,130,246,0.2)' : 'transparent',
                                  color: grades[c.key]?.grade === g ? 'var(--primary-light)' : 'var(--text-muted)',
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
            </>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Score each criterion from <strong>1 to 5</strong>. Maximum total: <strong>75 points</strong>.
              </p>
              <div className="table-container" style={{ marginBottom: '1rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>S/N</th>
                      <th style={{ width: '40%' }}>Performance Index</th>
                      <th style={{ width: '40%', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scoring Guide</th>
                      <th style={{ width: '10%' }}>Score (1–5)</th>
                      <th style={{ width: '5%' }}>Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NON_TEACHING_CRITERIA.map((c, i) => (
                      <tr key={c.key}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.label}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.hint}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {[1, 2, 3, 4, 5].map(n => (
                              <label key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', fontSize: '0.75rem', color: grades[c.key]?.score === String(n) ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: grades[c.key]?.score === String(n) ? 700 : 400 }}>
                                <input
                                  type="radio"
                                  name={`score-${c.key}`}
                                  value={n}
                                  checked={grades[c.key]?.score === String(n)}
                                  onChange={e => setNonTeachingScore(c.key, e.target.value)}
                                  style={{ accentColor: 'var(--primary-light)', width: 16, height: 16 }}
                                />
                                {n}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', textAlign: 'center' }}>5</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>TOTAL</td>
                      <td>
                        <span style={{
                          fontWeight: 800, fontSize: '1.1rem',
                          color: totalNonTeachingScore >= 45 ? '#34d399' : totalNonTeachingScore >= 37 ? '#fbbf24' : '#f87171',
                        }}>
                          {totalNonTeachingScore}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', textAlign: 'center', fontWeight: 700 }}>75</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Summary of Assessment <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="form-input" value={summaryAssessment} onChange={e => setSummaryAssessment(e.target.value)}>
                    <option value="">— Select —</option>
                    {SUMMARY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Recommended Action</label>
                  <select className="form-input" value={recommendedAction} onChange={e => setRecommendedAction(e.target.value)}>
                    <option value="">— Select —</option>
                    {RECOMMENDED_ACTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Written Recommendation / Remarks <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              className="form-input"
              rows={5}
              value={recommendation}
              onChange={e => setRecommendation(e.target.value)}
              placeholder="Provide your assessment and recommendations for this HOD's performance during the appraisal period..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={() => setSelected(null)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Assess HODs</h1>
        <p className="page-subtitle">As Dean, you assess all Heads of Department and Heads of Unit in your college.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Pending Assessments
            {pending.length > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.75rem' }}>{pending.length}</span>}
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : pending.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No pending assessments</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              HODs who submit their appraisal forms will appear here for your assessment.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>HOD / HOU Name</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Rank</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(a => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {a.part1?.surname} {a.part1?.firstName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{a.part1?.department || '—'}</td>
                    <td>
                      <span className="badge badge-info">
                        {a.category === 'academic' ? 'Academic' : a.category === 'senior_nonteaching' ? 'Senior Non-Teaching' : 'Junior Non-Teaching'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{a.part1?.rank || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-NG') : '—'}
                    </td>
                    <td>
                      <button onClick={() => openAssessment(a)} className="btn btn-primary btn-sm">
                        Assess →
                      </button>
                    </td>
                  </tr>
                ))}
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
                <tr>
                  <th>HOD / HOU Name</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completed.map(a => {
                  const cfg = STATUS_BADGES[a.status] || { label: a.status, badge: 'badge-secondary' };
                  return (
                    <tr key={a.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.part1?.surname} {a.part1?.firstName}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{a.part1?.department || '—'}</td>
                      <td><span className="badge badge-info">{a.category === 'academic' ? 'Academic' : a.category === 'senior_nonteaching' ? 'Senior NT' : 'Junior NT'}</span></td>
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

export default AssessHODsPage;
