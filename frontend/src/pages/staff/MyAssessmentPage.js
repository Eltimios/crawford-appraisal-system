import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyAppraisal, validateAssessment, submitDispute } from '../../services/appraisalService';

const YEAR = '2025/2026';

const GRADE_LABELS = { A: 'Very Good', B: 'Good', C: 'Satisfactory', D: 'Fair', E: 'Poor' };

// Must match AssessStaffPage criteria keys exactly
const ACADEMIC_CRITERIA = [
  { key: 'qualityOfTeaching', label: 'Quality of Teaching' },
  { key: 'departmentResponsibilities', label: "HOD/HOU's own Department Responsibilities" },
  { key: 'contributionToUniversity', label: 'Contribution to University/Community' },
  { key: 'serviceToProfession', label: 'Service to the Profession' },
  { key: 'research', label: 'Research' },
  { key: 'otherDepartmentResponsibilities', label: 'Other Department Responsibilities' },
  { key: 'contributionToCountry', label: 'Contributions to University/Community/Country' },
];

// Junior Non-Teaching — 15 criteria (max 75)
const JUNIOR_NON_TEACHING_CRITERIA = [
  { key: 'basicQualification',    label: 'Basic Qualification' },
  { key: 'punctuality',           label: 'Punctuality' },
  { key: 'lengthOfService',       label: 'Length of Service' },
  { key: 'resourcefulness',       label: 'Resourcefulness' },
  { key: 'qualityOfWork',         label: 'Quality of Work / Cataloguing / Numeracy' },
  { key: 'dressing',              label: 'Dressing / Physical Presentation' },
  { key: 'diligence',             label: 'Diligence / Attitude to Work' },
  { key: 'foresight',             label: 'Foresight / Initiative' },
  { key: 'dependability',         label: 'Dependability' },
  { key: 'trainability',          label: 'Trainability' },
  { key: 'clienteleRelationship', label: 'Clientele Relationship' },
  { key: 'teamWork',              label: 'Team Work' },
  { key: 'supportForSystem',      label: 'Support for the System' },
  { key: 'effectiveness',         label: 'Effectiveness' },
  { key: 'serviceability',        label: 'Serviceability' },
];

// Senior Non-Teaching — 20 criteria (max 100)
const SENIOR_NON_TEACHING_CRITERIA = [
  { key: 'academicQualification',     label: 'Academic Qualification' },
  { key: 'punctuality',               label: 'Punctuality' },
  { key: 'membershipProfessional',     label: 'Membership of Professional Associations' },
  { key: 'lengthOfService',           label: 'Length of Service' },
  { key: 'resourcefulness',           label: 'Resourcefulness' },
  { key: 'qualityOfWork',             label: 'Quality of Written Work / Cataloguing / Practical / Numeracy' },
  { key: 'dressing',                  label: 'Dressing / Physical Presentation in Relation to Schedules' },
  { key: 'diligence',                 label: 'Diligence / Attitude to Work' },
  { key: 'supervisionCoordination',   label: 'Supervision / Coordination' },
  { key: 'foresight',                 label: 'Foresight' },
  { key: 'mentoring',                 label: 'Mentoring' },
  { key: 'dependability',             label: 'Dependability' },
  { key: 'trainability',              label: 'Trainability' },
  { key: 'clienteleRelationship',     label: 'Clientele Relationship' },
  { key: 'teamWork',                  label: 'Team Work' },
  { key: 'supportForSystem',          label: 'Support for the System' },
  { key: 'ictCompliance',             label: 'ICT Compliance' },
  { key: 'workAttitudeUnderPressure', label: 'Work Attitude Under Pressure' },
  { key: 'versatility',               label: 'Versatility' },
  { key: 'proficiencySpokenEnglish',  label: 'Proficiency in Spoken English' },
];

const MyAssessmentPage = () => {
  const { userProfile } = useAuth();
  const isAcademic = userProfile?.staff_category === 'academic';
  const isNonTeaching = ['junior_nonteaching', 'senior_nonteaching'].includes(userProfile?.staff_category);
  const isSeniorNonTeaching = userProfile?.staff_category === 'senior_nonteaching';
  const nonTeachingCriteria = isSeniorNonTeaching ? SENIOR_NON_TEACHING_CRITERIA : JUNIOR_NON_TEACHING_CRITERIA;
  const maxNonTeachingScore = isSeniorNonTeaching ? 100 : 75;
  const role = userProfile?.role;

  // Who assesses this user?
  const assessorLabel = (role === 'dean' || role === 'vc')
    ? 'Vice Chancellor'
    : (role === 'hod' || role === 'hou')
      ? 'Dean'
      : role === 'reporting_officer'
        ? 'Registry'
        : isNonTeaching
          ? 'Reporting Officer'
          : 'HOD/HOU';

  // Who resolves disputes for this user?
  const disputeResolverLabel = isNonTeaching ? 'Registry' : 'Dean';
  const [appraisal, setAppraisal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disputeText, setDisputeText] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [submittingValidate, setSubmittingValidate] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const [validateSuccess, setValidateSuccess] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!userProfile) return;
    (async () => {
      try {
        const data = await getMyAppraisal(userProfile.id, YEAR);
        setAppraisal(data);
      } catch { /* silent until backend is live */ }
      finally { setLoading(false); }
    })();
  }, [userProfile]);

  const canViewAssessment = () => !!appraisal?.hodAssessment;

  const handleValidate = async () => {
    setSubmittingValidate(true);
    setActionError('');
    try {
      await validateAssessment(appraisal.id);
      setAppraisal(prev => ({ ...prev, status: 'viewed', rawStatus: 'staff_viewed' }));
      setValidateSuccess(true);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally { setSubmittingValidate(false); }
  };

  const handleSubmitDispute = async () => {
    if (!disputeText.trim()) return;
    setSubmittingDispute(true);
    setActionError('');
    try {
      await submitDispute(appraisal.id, userProfile.id, disputeText);
      setAppraisal(prev => ({ ...prev, status: 'disputed', rawStatus: 'dispute_raised', staffDispute: { comment: disputeText } }));
      setDisputeSuccess(true);
      setShowDisputeForm(false);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally { setSubmittingDispute(false); }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header"><h1 className="page-title">My Assessment</h1></div>
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  const assessment = appraisal?.hodAssessment;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Assessment</h1>
        <p className="page-subtitle">Your {assessorLabel} performance assessment for {YEAR}.</p>
      </div>

      {/* Status flow */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Assessment Status</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Form Submitted', done: !!appraisal?.status && appraisal.status !== 'draft' },
            { label: `${assessorLabel} Assessment`, done: !!assessment },
            { label: 'Assessment Viewed', done: ['viewed', 'disputed', 'resolved', 'college_board_reviewed', 'completed'].includes(appraisal?.status) },
            ...(isAcademic && role === 'staff' ? [{ label: 'College Board Review', done: ['college_board_reviewed', 'completed'].includes(appraisal?.rawStatus) }] : []),
            { label: 'Completed', done: ['college_board_reviewed', 'completed'].includes(appraisal?.rawStatus) },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.875rem', borderRadius: 999,
                background: step.done ? 'rgba(16,185,129,0.15)' : 'var(--bg-hover)',
                border: `1px solid ${step.done ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                fontSize: '0.8rem', fontWeight: 600,
                color: step.done ? '#34d399' : 'var(--text-muted)',
              }}>
                {step.done ? '✓' : '○'} {step.label}
              </div>
              {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>›</span>}
            </div>
          ))}
        </div>
      </div>

      {!appraisal || appraisal.rawStatus === 'draft' ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">Appraisal Form Not Submitted</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Submit your appraisal form first. Your assessment will appear here after {assessorLabel} evaluation.
            </p>
          </div>
        </div>
      ) : !canViewAssessment() ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">
              {`Awaiting ${assessorLabel} Assessment`}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {`Your ${assessorLabel} has not yet completed your assessment. You will be notified once it is ready.`}
            </p>
          </div>
        </div>
      ) : (
        <>
          {appraisal.status === 'resolved' && appraisal.deanResolution && (
            <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
              
              <div>
                <strong>Dean's Resolution:</strong>
                <p style={{ marginTop: '0.25rem' }}>{appraisal.deanResolution.resolution}</p>
              </div>
            </div>
          )}

          {/* Assessment grades */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              {assessorLabel} Assessment — {YEAR}
            </h3>

            {isAcademic ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  Grade Key: <strong>A</strong> = Very Good · <strong>B</strong> = Good · <strong>C</strong> = Satisfactory · <strong>D</strong> = Fair · <strong>E</strong> = Poor
                </p>
                <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Assessment Criterion</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ACADEMIC_CRITERIA.map(c => (
                        <tr key={c.key}>
                          <td style={{ color: 'var(--text-primary)' }}>{c.label}</td>
                          <td>
                            {assessment[c.key]?.grade ? (
                              <span className="badge badge-primary">
                                {assessment[c.key].grade} — {GRADE_LABELS[assessment[c.key].grade]}
                              </span>
                            ) : <span className="badge badge-secondary">—</span>}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Overall Grade</td>
                        <td>
                          {assessment.overallGrade ? (
                            <span className="badge badge-success" style={{ fontSize: '0.95rem' }}>
                              {assessment.overallGrade} — {GRADE_LABELS[assessment.overallGrade]}
                            </span>
                          ) : <span className="badge badge-secondary">—</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div className="table-container" style={{ marginBottom: '1.25rem' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '5%' }}>S/N</th>
                        <th>Performance Index</th>
                        <th style={{ width: '15%' }}>Score</th>
                        <th style={{ width: '10%' }}>Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nonTeachingCriteria.map((c, i) => (
                        <tr key={c.key}>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                          <td style={{ color: 'var(--text-primary)' }}>{c.label}</td>
                          <td style={{ fontWeight: 700, color: '#60a5fa' }}>
                            {assessment[c.key]?.score ?? '—'}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>5</td>
                        </tr>
                      ))}
                      <tr style={{ background: 'var(--bg-hover)' }}>
                        <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>TOTAL</td>
                        <td style={{ fontWeight: 800, fontSize: '1.1rem', color: '#34d399' }}>
                          {assessment.totalScore ?? '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{maxNonTeachingScore}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {assessment.summaryAssessment && (
                    <div style={{ background: 'var(--bg-hover)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Summary Assessment</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{assessment.summaryAssessment}</div>
                    </div>
                  )}
                  {assessment.recommendedAction && (
                    <div style={{ background: 'var(--bg-hover)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Recommended Action</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{assessment.recommendedAction}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {assessment.recommendation && (
              <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary-light)' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{assessorLabel} Recommendation</p>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{assessment.recommendation}</p>
              </div>
            )}
          </div>

          {/* Response section — shows validate form, or outcome card once acted */}
          {validateSuccess || ['viewed', 'staff_viewed'].includes(appraisal.rawStatus) ? (
            <div className="card">
              <div className="alert alert-success">
                <div>
                  <strong>Assessment Accepted</strong>
                  <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                    You have accepted this assessment. It will now proceed to the next review stage.
                  </p>
                </div>
              </div>
            </div>
          ) : disputeSuccess || ['disputed', 'dispute_raised'].includes(appraisal.rawStatus) ? (
            <div className="card">
              <div className="alert alert-warning">
                <div>
                  <strong>Invalidation Submitted</strong>
                  <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                    Your counter-comment has been escalated to the {disputeResolverLabel} for resolution. You will be notified of the outcome.
                  </p>
                </div>
              </div>
            </div>
          ) : !['resolved', 'dean_resolved', 'completed', 'college_board_reviewed'].includes(appraisal.rawStatus) ? (
            <div className="card">
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Validate or Invalidate Assessment</h3>
              {actionError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{actionError}</div>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Do you agree with this assessment? You may accept it or invalidate it with a counter-comment for the {disputeResolverLabel} to review.
              </p>
              {!showDisputeForm ? (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleValidate} disabled={submittingValidate} className="btn btn-success btn-sm">
                    {submittingValidate ? 'Saving...' : 'I Accept This Assessment'}
                  </button>
                  <button onClick={() => setShowDisputeForm(true)} className="btn btn-danger btn-sm">Invalidate Assessment</button>
                </div>
              ) : (
                <div>
                  <div className="form-group">
                    <label className="form-label">Your Counter-Comment</label>
                    <textarea
                      className="form-input"
                      rows={5}
                      value={disputeText}
                      onChange={e => setDisputeText(e.target.value)}
                      placeholder="Clearly state the grounds for invalidating this assessment and provide supporting evidence..."
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowDisputeForm(false)} className="btn btn-secondary btn-sm">Cancel</button>
                    <button onClick={handleSubmitDispute} disabled={submittingDispute || !disputeText.trim()} className="btn btn-danger btn-sm">
                      {submittingDispute ? 'Submitting...' : 'Submit Invalidation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default MyAssessmentPage;
