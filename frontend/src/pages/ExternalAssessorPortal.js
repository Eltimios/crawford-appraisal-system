import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  LuCheckCircle2, LuXCircle, LuLoader, LuBookOpen,
  LuUser, LuBuilding2, LuCalendar, LuExternalLink, LuBarChart2,
  LuFileText, LuUpload,
} from 'react-icons/lu';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api`;

const PUB_TYPE_LABELS = {
  journal: 'Journal Article',
  book: 'Book',
  book_chapter: 'Book Chapter',
  conference: 'Conference Paper',
  other: 'Other',
};

const GRADING_CRITERIA = [
  {
    key: 'research_output',
    label: 'Research Output',
    description: 'Volume, frequency, and consistency of academic publications (journals, books, conference papers)',
  },
  {
    key: 'research_quality',
    label: 'Quality of Research',
    description: 'Impact factor, originality, and relevance of work; calibre of publication outlets',
  },
  {
    key: 'teaching_competence',
    label: 'Teaching Competence',
    description: 'Breadth and depth of courses taught; contribution to curriculum development',
  },
  {
    key: 'professional_standing',
    label: 'Professional Standing',
    description: 'Membership in learned societies; participation in conferences and professional workshops',
  },
  {
    key: 'community_service',
    label: 'Service & Community Engagement',
    description: 'Administrative duties, community outreach, and industry or government engagement',
  },
  {
    key: 'promotion_suitability',
    label: 'Overall Suitability for Promotion',
    description: 'Holistic assessment of the candidate\'s readiness for the next academic rank',
  },
];

const RATING_OPTIONS = [
  { value: 5, label: 'Excellent',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { value: 4, label: 'Very Good',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 3, label: 'Good',       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 2, label: 'Fair',       color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { value: 1, label: 'Poor',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
];

const getRatingConfig = (value) => RATING_OPTIONS.find(r => r.value === value) || null;

const avgScore = (grades) => {
  const vals = GRADING_CRITERIA.map(c => grades[c.key]).filter(Boolean);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};

const suggestOutcome = (avg) => {
  if (avg >= 3.5) return 'positive';
  if (avg > 0 && avg < 2.5) return 'negative';
  return null;
};

// ── Shared page header ───────────────────────────────────────────────────────
const Header = () => (
  <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <img src="/crawford-logo.png" alt="Crawford University" style={{ height: 48, objectFit: 'contain' }} />
    <div>
      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', fontFamily: 'serif' }}>Crawford University</div>
      <div style={{ fontSize: '0.775rem', color: '#64748b' }}>Staff Appraisal — External Assessor Portal</div>
    </div>
  </div>
);

// ── Score summary bar ────────────────────────────────────────────────────────
const ScoreBar = ({ value, max = 5 }) => {
  const cfg = getRatingConfig(Math.round(value)) || RATING_OPTIONS[2];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.775rem' }}>
      <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: cfg.color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontWeight: 700, color: cfg.color, minWidth: 24, textAlign: 'right' }}>{value.toFixed(1)}</span>
    </div>
  );
};

const ExternalAssessorPortal = () => {
  const { assessorId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  // Form state
  const [grades, setGrades] = useState({});
  const [outcome, setOutcome] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [notes, setNotes] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedFile, setSubmittedFile] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/public/assessor/${assessorId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setPageError(d.error); return; }
        setData(d);
        if (d.assessor.outcome !== 'pending') {
          setSubmitted(true);
          setOutcome(d.assessor.outcome);
          setReportDate(d.assessor.report_date || '');
          setNotes(d.assessor.report_notes || '');
          if (d.assessor.report_grades) setGrades(d.assessor.report_grades);
          if (d.assessor.report_file_url) {
            setSubmittedFile({ url: d.assessor.report_file_url, name: d.assessor.report_file_name });
          }
        }
      })
      .catch(() => setPageError('Failed to connect to the server. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [assessorId]);

  const allRated = GRADING_CRITERIA.every(c => grades[c.key]);
  const avg = avgScore(grades);
  const suggested = suggestOutcome(avg);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setFileError('Please select a PDF file.'); return; }
    if (file.size > 15 * 1024 * 1024) { setFileError('File must be under 15MB.'); return; }
    setFileError(null);
    setReportFile(file);
  };

  const handleSubmit = async () => {
    if (!allRated) { setSubmitError('Please rate all criteria before submitting.'); return; }
    if (!outcome) { setSubmitError('Please select a final assessment outcome.'); return; }
    if (!reportFile) { setSubmitError('Please attach your detailed assessment report as a PDF before submitting.'); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append('outcome', outcome);
      formData.append('report_date', reportDate || '');
      formData.append('report_notes', notes || '');
      formData.append('report_grades', JSON.stringify(grades));
      formData.append('report_file', reportFile);

      const res = await fetch(`${API_BASE}/public/assessor/${assessorId}/submit`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) { setSubmitError(json.error || 'Submission failed. Please try again.'); return; }
      setSubmittedFile({ url: json.assessor.report_file_url, name: json.assessor.report_file_name });
      setSubmitted(true);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 72px)', flexDirection: 'column', gap: '1rem', color: '#64748b' }}>
        <LuLoader size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <div>Loading your assessment portal…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (pageError) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <div style={{ maxWidth: 560, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '2.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <LuXCircle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.5rem' }}>Portal Not Found</div>
          <div style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>{pageError}</div>
        </div>
      </div>
    </div>
  );

  const { assessor, candidate, publications } = data;

  // ── Already submitted ──────────────────────────────────────────────────────
  if (submitted) {
    const submittedGrades = Object.keys(grades).length > 0 ? grades : null;
    const submittedAvg = submittedGrades ? avgScore(grades) : null;
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
        <Header />
        <div style={{ maxWidth: 680, margin: '3rem auto', padding: '0 1.5rem' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '2rem 2.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <LuCheckCircle2 size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.5rem' }}>Assessment Report Submitted</div>
            <div style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Thank you, <strong>{assessor.name}</strong>. Your assessment of <strong>{candidate.full_name}</strong> has been received.
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.6rem 1.25rem', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', background: outcome === 'positive' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: outcome === 'positive' ? '#10b981' : '#ef4444' }}>
              {outcome === 'positive' ? <LuCheckCircle2 size={16} /> : <LuXCircle size={16} />}
              Outcome: {outcome === 'positive' ? 'Positive — Recommended for Promotion' : 'Negative — Not Recommended'}
            </div>
          </div>

          {submittedGrades && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem 2rem', marginTop: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Submitted Grades</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {GRADING_CRITERIA.map(c => {
                  const val = submittedGrades[c.key];
                  const cfg = getRatingConfig(val);
                  return (
                    <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>{c.label}</div>
                      {cfg && (
                        <span style={{ fontSize: '0.775rem', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '0.2rem 0.6rem', borderRadius: 6, whiteSpace: 'nowrap' }}>
                          {cfg.label} ({val}/5)
                        </span>
                      )}
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Average Score</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: getRatingConfig(Math.round(submittedAvg))?.color || '#64748b' }}>
                    {submittedAvg.toFixed(2)} / 5.00
                  </span>
                </div>
              </div>
            </div>
          )}

          {notes && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem 2rem', marginTop: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Assessment Notes</div>
              <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.7 }}>{notes}</div>
            </div>
          )}

          {submittedFile && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem 2rem', marginTop: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <LuFileText size={22} color="#3b82f6" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detailed Report Document</div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{submittedFile.name}</div>
                </div>
              </div>
              <a href={submittedFile.url} target="_blank" rel="noopener noreferrer"
                style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', textDecoration: 'none', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.5rem 0.875rem' }}>
                <LuExternalLink size={13} /> View PDF
              </a>
            </div>
          )}

          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '2rem', paddingBottom: '2rem' }}>
            Crawford University, Igbesa, Ogun State — Staff Appraisal Management System
          </div>
        </div>
      </div>
    );
  }

  // ── Main portal ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Header />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Welcome */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem 2rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Welcome, External Assessor</div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b', marginBottom: '0.2rem' }}>{assessor.name}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>{assessor.institution}</div>
          <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.7 }}>
            You have been invited as an <strong>{assessor.assessor_type}</strong> assessor
            {assessor.scope ? ` (${assessor.scope})` : ''} for the{' '}
            <strong>{assessor.stage === 'final' ? 'final stage' : 'initial stage'}</strong> assessment.
            Please review the candidate's publications, complete the grading form, and submit your report.
          </div>
        </div>

        {/* Candidate info */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem 2rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Candidate Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { icon: LuUser,      label: 'Full Name',       value: candidate.full_name },
              { icon: LuBuilding2, label: 'Department',      value: candidate.department },
              { icon: LuBuilding2, label: 'College',         value: candidate.college },
              { icon: LuUser,      label: 'Current Rank',    value: candidate.current_rank },
              { icon: LuCalendar,  label: 'Appraisal Year',  value: candidate.appraisal_year },
              { icon: LuUser,      label: 'Staff ID',        value: candidate.staff_id },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{label}</div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{value || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Publications */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem 2rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <LuBookOpen size={15} color="#64748b" />
            <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Publications ({publications.length})
            </div>
          </div>
          {publications.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No publications on record for this candidate.</div>
          ) : (
            <ol style={{ margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {publications.map((pub, i) => (
                <li key={pub.id || i} style={{ paddingBottom: '0.75rem', borderBottom: i < publications.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem', lineHeight: 1.5, flex: 1 }}>{pub.title}</div>
                    {pub.file_url && (
                      <a href={pub.file_url} target="_blank" rel="noopener noreferrer"
                        style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600, color: '#3b82f6', textDecoration: 'none', border: '1px solid #bfdbfe', borderRadius: 6, padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}>
                        <LuExternalLink size={11} /> View PDF
                      </a>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                    {pub.journal_name && <span>{pub.journal_name}</span>}
                    {pub.year_of_publication && <span> · {pub.year_of_publication}</span>}
                    {pub.publisher && !pub.journal_name && <span>{pub.publisher}</span>}
                    {pub.isbn_issn && <span> · ISBN/ISSN: {pub.isbn_issn}</span>}
                    {pub.publication_type && (
                      <span style={{ marginLeft: 8, fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                        {PUB_TYPE_LABELS[pub.publication_type] || pub.publication_type}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ── Grading Criteria ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem 2rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <LuBarChart2 size={15} color="#64748b" />
            <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Assessment Grading
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            Rate the candidate on each criterion using the 5-point scale below. All criteria must be rated before you can submit.
          </div>

          {/* Rating scale legend */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {RATING_OPTIONS.map(r => (
              <span key={r.value} style={{ fontSize: '0.72rem', fontWeight: 700, color: r.color, background: r.bg, padding: '0.2rem 0.6rem', borderRadius: 6 }}>
                {r.value} — {r.label}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {GRADING_CRITERIA.map((criterion, idx) => {
              const selected = grades[criterion.key];
              const cfg = selected ? getRatingConfig(selected) : null;
              return (
                <div key={criterion.key} style={{ paddingBottom: '1.25rem', borderBottom: idx < GRADING_CRITERIA.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>{idx + 1}. {criterion.label}</span>
                      {cfg && (
                        <span style={{ marginLeft: 10, fontSize: '0.72rem', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                          {cfg.label} · {selected}/5
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: 1.5 }}>{criterion.description}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {RATING_OPTIONS.map(r => (
                      <button
                        key={r.value}
                        onClick={() => setGrades(prev => ({ ...prev, [criterion.key]: r.value }))}
                        style={{
                          padding: '0.45rem 0.875rem',
                          borderRadius: 8,
                          border: `2px solid ${selected === r.value ? r.color : '#e5e7eb'}`,
                          background: selected === r.value ? r.bg : '#f9fafb',
                          color: selected === r.value ? r.color : '#6b7280',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                        }}>
                        {r.value} — {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Score Summary (shows after all criteria rated) ── */}
        {allRated && (
          <div style={{ background: '#fff', border: `2px solid ${avg >= 3.5 ? '#10b981' : avg >= 2.5 ? '#f59e0b' : '#ef4444'}`, borderRadius: 12, padding: '1.5rem 2rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score Summary</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.4rem', color: getRatingConfig(Math.round(avg))?.color || '#1e293b' }}>
                  {avg.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>/ 5.00</span>
                {getRatingConfig(Math.round(avg)) && (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: getRatingConfig(Math.round(avg)).color, background: getRatingConfig(Math.round(avg)).bg, padding: '0.3rem 0.75rem', borderRadius: 8 }}>
                    {getRatingConfig(Math.round(avg)).label}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              {GRADING_CRITERIA.map(c => (
                <div key={c.key} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>{c.label}</div>
                  <ScoreBar value={grades[c.key]} />
                </div>
              ))}
            </div>
            {suggested && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: suggested === 'positive' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${suggested === 'positive' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, fontSize: '0.825rem', color: suggested === 'positive' ? '#065f46' : '#991b1b', fontWeight: 600 }}>
                {suggested === 'positive'
                  ? '✓ Based on your grades, a Positive outcome is suggested. You may confirm or override below.'
                  : '✗ Based on your grades, a Negative outcome is suggested. You may confirm or override below.'}
              </div>
            )}
          </div>
        )}

        {/* ── Assessment form ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem 2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
            Final Assessment Report
          </div>

          {/* Final outcome */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>
              Final Outcome <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { value: 'positive', label: 'Positive — Recommend for Promotion', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <LuCheckCircle2 size={16} /> },
                { value: 'negative', label: 'Negative — Do Not Recommend',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: <LuXCircle size={16} /> },
              ].map(opt => (
                <button key={opt.value} onClick={() => setOutcome(opt.value)}
                  style={{
                    flex: '1 1 220px', padding: '0.875rem 1rem', borderRadius: 10,
                    border: `2px solid ${outcome === opt.value ? opt.color : '#e5e7eb'}`,
                    background: outcome === opt.value ? opt.bg : '#f9fafb',
                    color: outcome === opt.value ? opt.color : '#6b7280',
                    fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    transition: 'all 0.15s',
                  }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report date */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>Date of Report</label>
            <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.875rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>Assessment Notes / Remarks</label>
            <div style={{ fontSize: '0.775rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Provide qualitative remarks on the candidate's research output, academic standing, and suitability for promotion.
            </div>
            <textarea rows={6}
              placeholder="Please provide detailed remarks on the candidate's scholarly work, publication quality, research contributions, and overall suitability for promotion…"
              value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 0.875rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.875rem', color: '#1e293b', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
          </div>

          {/* Detailed report document upload */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
              Detailed Assessment Report (PDF) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ fontSize: '0.775rem', color: '#94a3b8', marginBottom: '0.6rem' }}>
              Upload your full written assessment report as a PDF document, in addition to the grading and notes above.
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              border: `2px dashed ${reportFile ? '#10b981' : '#cbd5e1'}`, borderRadius: 10,
              padding: '1.25rem', cursor: 'pointer',
              background: reportFile ? 'rgba(16,185,129,0.05)' : '#f9fafb',
              transition: 'all 0.15s',
            }}>
              <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              {reportFile ? (
                <>
                  <LuFileText size={18} color="#10b981" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065f46' }}>{reportFile.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({(reportFile.size / 1024 / 1024).toFixed(2)} MB) — click to replace</span>
                </>
              ) : (
                <>
                  <LuUpload size={18} color="#6b7280" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>Click to select a PDF file (max 15MB)</span>
                </>
              )}
            </label>
            {fileError && <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#ef4444' }}>{fileError}</p>}
          </div>

          {submitError && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#b91c1c', fontSize: '0.85rem' }}>
              {submitError}
            </div>
          )}

          {!allRated && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#92400e', fontSize: '0.82rem' }}>
              Please complete all {GRADING_CRITERIA.length} grading criteria above before submitting. ({Object.keys(grades).length}/{GRADING_CRITERIA.length} rated)
            </div>
          )}

          {allRated && outcome && !reportFile && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#92400e', fontSize: '0.82rem' }}>
              Please attach your detailed assessment report as a PDF above before submitting.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSubmit} disabled={submitting || !allRated || !outcome || !reportFile}
              style={{
                padding: '0.75rem 2rem', borderRadius: 9, border: 'none',
                background: (submitting || !allRated || !outcome || !reportFile) ? '#cbd5e1' : '#3b82f6',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                cursor: (submitting || !allRated || !outcome || !reportFile) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                transition: 'background 0.15s',
              }}>
              {submitting
                ? <><LuLoader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                : <><LuCheckCircle2 size={16} /> Submit Assessment Report</>}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '2rem', paddingBottom: '2rem' }}>
          Crawford University, Igbesa, Ogun State, Nigeria — Staff Appraisal Management System
        </div>
      </div>
    </div>
  );
};

export default ExternalAssessorPortal;
