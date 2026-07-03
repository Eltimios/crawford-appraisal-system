import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDepartmentAppraisals, submitHODAssessment } from '../../services/appraisalService';

const YEAR = '2025/2026';

const GRADES = ['A', 'B', 'C', 'D', 'E'];
const GRADE_LABELS = { A: 'Very Good', B: 'Good', C: 'Satisfactory', D: 'Fair', E: 'Poor' };

// Academic staff HOD Assessment A — 7 criteria, A–E grades (Part 2, Assessment A of APER form)
const ACADEMIC_CRITERIA = [
  { key: 'qualityOfTeaching', label: 'Quality of Teaching' },
  { key: 'departmentResponsibilities', label: "HOD/HOU's own Department Responsibilities" },
  { key: 'contributionToUniversity', label: 'Contribution to University/Community' },
  { key: 'serviceToProfession', label: 'Service to the Profession' },
  { key: 'research', label: 'Research' },
  { key: 'otherDepartmentResponsibilities', label: 'Other Department Responsibilities' },
  { key: 'contributionToCountry', label: 'Contributions to University/Community/Country' },
];

// Junior Non-Teaching — 15-item OMC (1–5 per item, max 75)
const JUNIOR_NON_TEACHING_CRITERIA = [
  { key: 'basicQualification',    label: 'Basic Qualification',                       hint: 'OND=5 · SSCE+English=4 · SSCE 5 credits=3 · SSCE attempt=2 · JSS III=1' },
  { key: 'punctuality',           label: 'Punctuality',                               hint: 'Never absent/late=5 · 20% rate=4 · 50%=3 · 70%=2 · Fully absent=1' },
  { key: 'lengthOfService',       label: 'Length of Service',                         hint: '21yr+=5 · 16-20yr=4 · 11-15yr=3 · 6-10yr=2 · <5yr=1' },
  { key: 'resourcefulness',       label: 'Resourcefulness',                           hint: 'Commendation=5 · No query=4 · 1 query=3 · 2 queries=2 · Warning/Suspension=1' },
  { key: 'qualityOfWork',         label: 'Quality of Work / Cataloguing / Numeracy',  hint: 'Excellent=5 · Very good=4 · Good=3 · Fairly good=2 · Low quality=1' },
  { key: 'dressing',              label: 'Dressing / Physical Presentation',           hint: 'Excellent=5 · Very good=4 · Good=3 · Fair=2 · Poor=1' },
  { key: 'diligence',             label: 'Diligence / Attitude to Work',               hint: 'Outstanding=5 · Very hardworking=4 · Hardworking=3 · Fairly=2 · Not hardworking=1' },
  { key: 'foresight',             label: 'Foresight / Initiative',                     hint: 'Very high initiative=5 · High=4 · Moderate=3 · Low=2 · Very passive=1' },
  { key: 'dependability',         label: 'Dependability',                              hint: 'Completely trustworthy=5 · Very dependable=4 · Dependable=3 · Fairly=2 · Not dependable=1' },
  { key: 'trainability',          label: 'Trainability',                               hint: 'Excellent potentials=5 · Very high=4 · High=3 · Fair=2 · Low=1' },
  { key: 'clienteleRelationship', label: 'Clientele Relationship',                     hint: 'Extremely courteous=5 · Very courteous=4 · Courteous=3 · Fairly=2 · Not courteous=1' },
  { key: 'teamWork',              label: 'Team Work',                                  hint: 'Very effective=5 · Effective=4 · Fairly=3 · Just a team player=2 · Not a team player=1' },
  { key: 'supportForSystem',      label: 'Support for the System',                     hint: 'Extremely committed=5 · Highly=4 · Committed=3 · Fairly=2 · Not committed=1' },
  { key: 'effectiveness',         label: 'Effectiveness',                              hint: 'Greatly effective=5 · Very effective=4 · Effective=3 · Not quite=2 · Not effective=1' },
  { key: 'serviceability',        label: 'Serviceability',                             hint: 'Extremely serviceable=5 · Very=4 · Serviceable=3 · Just=2 · Not serviceable=1' },
];

// Senior Non-Teaching — 20-item OMC (1–5 per item, max 100)
const SENIOR_NON_TEACHING_CRITERIA = [
  { key: 'academicQualification',        label: 'Academic Qualification',                       hint: '1st Class/HND Distinction=5 · 2.1/Upper Credit=4 · 2.2/Lower Credit=3 · 3rd Class=2 · Pass=1 (Promoted from Junior w/ additional qual=3, basic qual=2)' },
  { key: 'punctuality',                  label: 'Punctuality',                                  hint: 'Never absent/late=5 · 20% rate=4 · 40%=3 · 60%=2 · 80%=1' },
  { key: 'membershipProfessional',        label: 'Membership of Professional Associations',      hint: 'Fellow/Council Member=5 · Member (Certified)=4 · Associate=3 · Student Member=2 · Non-Member=1' },
  { key: 'lengthOfService',              label: 'Length of Service',                            hint: '21yr+=5 · 16-20yr=4 · 11-15yr=3 · 6-10yr=2 · <5yr=1' },
  { key: 'resourcefulness',              label: 'Resourcefulness',                              hint: 'Commendation=5 · No query=4 · 1 query=3 · 2 queries=2 · Warning/Suspension=1' },
  { key: 'qualityOfWork',                label: 'Quality of Written Work / Cataloguing / Practical / Numeracy', hint: 'Excellent=5 · Very good=4 · Good=3 · Fairly good=2 · Low quality=1' },
  { key: 'dressing',                     label: 'Dressing / Physical Presentation in Relation to Schedules',   hint: 'Excellent=5 · Very good=4 · Good=3 · Fair=2 · Poor=1' },
  { key: 'diligence',                    label: 'Diligence / Attitude to Work',                 hint: 'Outstanding=5 · Very hardworking=4 · Hardworking=3 · Fairly=2 · Not hardworking=1' },
  { key: 'supervisionCoordination',      label: 'Supervision / Coordination',                   hint: 'Extremely effective=5 · Very effective=4 · Effective=3 · Fairly=2 · Not effective=1' },
  { key: 'foresight',                    label: 'Foresight',                                    hint: 'Very high initiative & drive=5 · High=4 · Moderate=3 · Low=2 · Very passive=1' },
  { key: 'mentoring',                    label: 'Mentoring',                                    hint: 'Very effective=5 · Effective=4 · Fairly effective=3 · Not effective=2 · Extremely ineffective=1' },
  { key: 'dependability',                label: 'Dependability',                                hint: 'Completely trustworthy & Dependable=5 · Very dependable=4 · Dependable=3 · Fairly=2 · Not dependable=1' },
  { key: 'trainability',                 label: 'Trainability',                                 hint: 'Excellent potentials/Willingness=5 · Very High=4 · High=3 · Fair=2 · Low=1' },
  { key: 'clienteleRelationship',        label: 'Clientele Relationship',                       hint: 'Extremely courteous=5 · Very courteous=4 · Courteous=3 · Fairly=2 · Not courteous=1' },
  { key: 'teamWork',                     label: 'Team Work',                                    hint: 'Very effective=5 · Effective=4 · Fairly=3 · Just a team player=2 · Not a team player=1' },
  { key: 'supportForSystem',             label: 'Support for the System',                       hint: 'Extremely committed (extra mile)=5 · Highly=4 · Committed (minimum)=3 · Fairly=2 · Not committed=1' },
  { key: 'ictCompliance',                label: 'ICT Compliance',                               hint: 'Highly dexterous=5 · Good=4 · Average=3 · Low interest=2 · Lack of interest=1' },
  { key: 'workAttitudeUnderPressure',    label: 'Work Attitude Under Pressure',                 hint: 'Extremely capable=5 · Highly capable=4 · Capable=3 · Fairly capable=2 · Not capable=1' },
  { key: 'versatility',                  label: 'Versatility',                                  hint: 'Extremely versatile=5 · Highly=4 · Fairly=3 · Versatile=2 · Not versatile=1' },
  { key: 'proficiencySpokenEnglish',     label: 'Proficiency in Spoken English',                hint: 'Extremely proficient=5 · Highly=4 · Proficient=3 · Fairly=2 · Not proficient=1' },
];

// Keep backward-compatible alias (used elsewhere)
const NON_TEACHING_CRITERIA = JUNIOR_NON_TEACHING_CRITERIA;

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
  viewed: { label: 'Viewed by Staff', badge: 'badge-primary' },
  disputed: { label: 'Invalidated', badge: 'badge-danger' },
  resolved: { label: 'Resolved', badge: 'badge-success' },
};

const getNonTeachingCriteria = (category) =>
  category === 'senior_nonteaching' ? SENIOR_NON_TEACHING_CRITERIA : JUNIOR_NON_TEACHING_CRITERIA;

const initGrades = (category) => {
  if (category === 'academic') {
    return ACADEMIC_CRITERIA.reduce((acc, c) => ({ ...acc, [c.key]: { grade: '' } }), {});
  }
  return getNonTeachingCriteria(category).reduce((acc, c) => ({ ...acc, [c.key]: { score: '' } }), {});
};

const AssessStaffPage = () => {
  const { userProfile, userRole } = useAuth();
  const isReportingOfficer = userRole === 'reporting_officer';
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('senior'); // 'senior' | 'junior' — RO only
  const [grades, setGrades] = useState({});
  const [recommendation, setRecommendation] = useState('');
  const [overallGrade, setOverallGrade] = useState('');
  const [summaryAssessment, setSummaryAssessment] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userProfile?.id) return;
    (async () => {
      try {
        const data = await getDepartmentAppraisals(userProfile.department, YEAR);
        setAppraisals(data);
      } catch { /* silent until backend is live */ }
      finally { setLoading(false); }
    })();
  }, [userProfile]);

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

  const setAcademicGrade = (criterionKey, gradeValue) => {
    setGrades(prev => ({ ...prev, [criterionKey]: { grade: gradeValue } }));
  };

  const setNonTeachingScore = (criterionKey, scoreValue) => {
    setGrades(prev => ({ ...prev, [criterionKey]: { score: scoreValue } }));
  };

  const totalNonTeachingScore = !selected || selected.category === 'academic'
    ? 0
    : Object.values(grades).reduce((sum, g) => sum + (parseInt(g.score) || 0), 0);

  const maxNonTeachingScore = selected?.category === 'senior_nonteaching' ? 100 : 75;

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
      await submitHODAssessment(selected.id, assessment, selected.category);
      setAppraisals(prev => prev.map(a =>
        a.id === selected.id ? { ...a, status: 'assessed', hodAssessment: assessment } : a
      ));
      setSuccess('Assessment submitted successfully.');
      setTimeout(() => { setSelected(null); setSuccess(''); }, 2000);
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // For RO: filter by the active tab category
  const visibleAppraisals = isReportingOfficer
    ? appraisals.filter(a => a.category === (activeTab === 'senior' ? 'senior_nonteaching' : 'junior_nonteaching'))
    : appraisals;

  const pending = visibleAppraisals.filter(a => a.status === 'submitted');
  const completed = visibleAppraisals.filter(a => a.status !== 'submitted');

  // Counts for tab badges
  const seniorPending = appraisals.filter(a => a.category === 'senior_nonteaching' && a.status === 'submitted').length;
  const juniorPending = appraisals.filter(a => a.category === 'junior_nonteaching' && a.status === 'submitted').length;

  if (selected) {
    const isAcademic = selected.category === 'academic';
    const part1 = selected.part1 || {};

    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
            ← Back to Queue
          </button>
          <h1 className="page-title">Assessment — {part1.firstName} {part1.surname}</h1>
          <p className="page-subtitle">
            {isAcademic ? 'Academic Staff' : selected.category === 'senior_nonteaching' ? 'Senior Non-Teaching Staff' : 'Junior Non-Teaching Staff'} · {part1.department} · {YEAR}
          </p>
        </div>

        {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}><span>{success}</span></div>}
        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}><span>{error}</span></div>}

        {/* Staff info */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Staff Information</h3>
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

        {/* Assessment form */}
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
                Score each criterion from <strong>1 to 5</strong> using the guide below. Maximum total: <strong>{maxNonTeachingScore} points</strong>.
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
                    {getNonTeachingCriteria(selected.category).map((c, i) => (
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
                          color: totalNonTeachingScore >= (maxNonTeachingScore * 0.6) ? '#34d399' : totalNonTeachingScore >= (maxNonTeachingScore * 0.5) ? '#fbbf24' : '#f87171',
                        }}>
                          {totalNonTeachingScore}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', textAlign: 'center', fontWeight: 700 }}>{maxNonTeachingScore}</td>
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
              placeholder="Provide your assessment, recommendations, and any observations about this staff member's performance during the appraisal period..."
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
        <h1 className="page-title">{isReportingOfficer ? 'Assess My Staff' : 'Assess Staff'}</h1>
        <p className="page-subtitle">
          {isReportingOfficer
            ? 'Review and grade the non-teaching staff assigned to you who have submitted their appraisal forms.'
            : 'Review and grade staff who have submitted their appraisal forms.'}
        </p>
      </div>

      {/* RO sub-portal tabs */}
      {isReportingOfficer && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { key: 'senior', label: 'Senior Non-Teaching', count: seniorPending },
            { key: 'junior', label: 'Junior Non-Teaching', count: juniorPending },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', borderRadius: 'var(--radius)',
                border: `2px solid ${activeTab === tab.key ? 'var(--role-accent)' : 'var(--border)'}`,
                background: activeTab === tab.key ? 'var(--role-accent-dim)' : 'var(--bg-secondary)',
                color: activeTab === tab.key ? 'var(--role-accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: '#f59e0b', color: '#fff',
                  borderRadius: 999, minWidth: 20, height: 20,
                  fontSize: '0.7rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {isReportingOfficer
              ? `${activeTab === 'senior' ? 'Senior' : 'Junior'} Non-Teaching — Pending Assessments`
              : 'Pending Assessments'}
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
              {isReportingOfficer
                ? `${activeTab === 'senior' ? 'Senior' : 'Junior'} non-teaching staff who submit their forms will appear here.`
                : 'Staff who submit their appraisal forms will appear here for you to assess.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Category</th>
                  <th>Rank / Designation</th>
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
                    <td>
                      <span className="badge badge-info">
                        {a.category === 'academic' ? 'Academic' : a.category === 'senior_nonteaching' ? 'Senior Non-Teaching' : 'Junior Non-Teaching'}
                      </span>
                    </td>
                    <td>{a.part1?.rank || a.part1?.designation || '—'}</td>
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
                  <th>Staff Name</th>
                  <th>Category</th>
                  <th>Result</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completed.map(a => {
                  const cfg = STATUS_BADGES[a.status] || STATUS_BADGES.assessed;
                  const result = a.category === 'academic'
                    ? a.hodAssessment?.overallGrade
                      ? `Grade ${a.hodAssessment.overallGrade} — ${GRADE_LABELS[a.hodAssessment.overallGrade]}`
                      : '—'
                    : a.hodAssessment?.totalScore !== undefined
                      ? `${a.hodAssessment.totalScore} / ${a.category === 'senior_nonteaching' ? 100 : 75} · ${a.hodAssessment.summaryAssessment || '—'}`
                      : '—';
                  return (
                    <tr key={a.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.part1?.surname} {a.part1?.firstName}</td>
                      <td><span className="badge badge-info">{a.category === 'academic' ? 'Academic' : a.category === 'senior_nonteaching' ? 'Senior NT' : 'Junior NT'}</span></td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{result}</td>
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

export default AssessStaffPage;
