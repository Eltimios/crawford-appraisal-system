import { useState, useEffect, useCallback } from 'react';
import {
  LuUsers, LuPlus, LuTrash2, LuCheckCircle2, LuXCircle, LuClock,
  LuLoader, LuX, LuChevronDown, LuChevronUp, LuBadge, LuSearch,
  LuGlobe, LuBuilding2, LuLink2, LuFileText, LuExternalLink,
} from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ASSESSOR_RANKS    = ['Lecturer I', 'Senior Lecturer', 'Associate Professor'];
const PROFESSORIAL_RANKS = ['Senior Lecturer', 'Associate Professor'];

const GRADING_CRITERIA = [
  { key: 'research_output',      label: 'Research Output' },
  { key: 'research_quality',     label: 'Quality of Research' },
  { key: 'teaching_competence',  label: 'Teaching Competence' },
  { key: 'professional_standing',label: 'Professional Standing' },
  { key: 'community_service',    label: 'Service & Community Engagement' },
  { key: 'promotion_suitability',label: 'Overall Suitability for Promotion' },
];

const RATING_CONFIG = {
  5: { label: 'Excellent',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  4: { label: 'Very Good',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  3: { label: 'Good',       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  2: { label: 'Fair',       color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  1: { label: 'Poor',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const OUTCOME_CONFIG = {
  pending:  { label: 'Pending',  color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: <LuClock size={13} /> },
  positive: { label: 'Positive', color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: <LuCheckCircle2 size={13} /> },
  negative: { label: 'Negative', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: <LuXCircle size={13} /> },
};

const OutcomeBadge = ({ outcome }) => {
  const cfg = OUTCOME_CONFIG[outcome] || OUTCOME_CONFIG.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: cfg.bg, color: cfg.color }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const ScopeBadge = ({ scope }) => {
  if (!scope) return null;
  const isIntl = scope === 'international';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '0.15rem 0.5rem', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: isIntl ? 'rgba(99,102,241,0.12)' : 'rgba(14,165,233,0.12)', color: isIntl ? '#6366f1' : '#0ea5e9' }}>
      {isIntl ? <LuGlobe size={11} /> : <LuBuilding2 size={11} />}
      {isIntl ? 'International' : 'National'}
    </span>
  );
};

const progressBar = (positive, total, color = '#10b981') => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.775rem' }}>
    <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: total ? `${(positive / total) * 100}%` : '0%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{positive}/{total} positive</span>
  </div>
);

// ─────────────────────── Outcome Modal ─────────────────────────────────────
const OutcomeModal = ({ assessor, onClose, onSaved }) => {
  const [outcome, setOutcome]       = useState(assessor.outcome || 'pending');
  const [reportDate, setReportDate] = useState(assessor.report_date || '');
  const [notes, setNotes]           = useState(assessor.report_notes || '');
  const [saving, setSaving]         = useState(false);

  const grades     = assessor.report_grades || null;
  const hasGrades  = grades && Object.keys(grades).length > 0;
  const avgScore   = hasGrades
    ? GRADING_CRITERIA.reduce((s, c) => s + (grades[c.key] || 0), 0) / GRADING_CRITERIA.length
    : null;

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/assessors/record/${assessor.id}`, { outcome, report_date: reportDate || null, report_notes: notes || null });
      toast.success('Outcome recorded.');
      onSaved(res.data.assessor);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record outcome.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '100%', maxWidth: hasGrades ? 580 : 440, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Record Report Outcome</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><LuX size={17} /></button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Assessor: <strong style={{ color: 'var(--text-primary)' }}>{assessor.name}</strong> — {assessor.institution}
          </div>

          {/* Detailed report document from portal */}
          {assessor.report_file_url && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                <LuFileText size={17} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {assessor.report_file_name || 'Assessment Report.pdf'}
                </span>
              </div>
              <a href={assessor.report_file_url} target="_blank" rel="noopener noreferrer"
                style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textDecoration: 'none', border: '1px solid #bfdbfe', borderRadius: 6, padding: '0.25rem 0.6rem' }}>
                <LuExternalLink size={11} /> View PDF
              </a>
            </div>
          )}

          {/* Grades from portal */}
          {hasGrades && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Grades Submitted via Portal
                </span>
                {avgScore !== null && (
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: RATING_CONFIG[Math.round(avgScore)]?.color || 'var(--text-primary)' }}>
                    Avg: {avgScore.toFixed(2)}/5.00 —{' '}
                    <span style={{ fontWeight: 700 }}>{RATING_CONFIG[Math.round(avgScore)]?.label || ''}</span>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {GRADING_CRITERIA.map(c => {
                  const val = grades[c.key];
                  const cfg = RATING_CONFIG[val];
                  return (
                    <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{c.label}</span>
                      {cfg ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '0.15rem 0.5rem', borderRadius: 6, whiteSpace: 'nowrap' }}>
                          {cfg.label} ({val}/5)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Report Outcome</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['positive', 'negative', 'pending'].map(o => {
                const cfg = OUTCOME_CONFIG[o];
                return (
                  <button key={o} onClick={() => setOutcome(o)} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: `2px solid ${outcome === o ? cfg.color : 'var(--border)'}`, background: outcome === o ? cfg.bg : 'transparent', color: outcome === o ? cfg.color : 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Report Date</label>
            <input type="date" className="form-input" value={reportDate} onChange={e => setReportDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea rows={3} className="form-input" placeholder="Qualitative rating, publication score, remarks…" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={save} className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Outcome'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────── Add Assessor Modal ─────────────────────────────────
const AddAssessorModal = ({ appraisalId, stage, rank, onClose, onAdded }) => {
  const isProfessorial = PROFESSORIAL_RANKS.includes(rank);
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [institution, setInstitution] = useState('');
  const [assessorType, setAssessorType] = useState(stage === 'final' ? 'external' : '');
  const [scope, setScope]         = useState('');
  const [saving, setSaving]       = useState(false);

  const save = async () => {
    if (!name.trim() || !institution.trim() || !assessorType) {
      toast.error('Name, institution, and type are required.'); return;
    }
    if (stage === 'final' && !scope) {
      toast.error('Scope (national/international) is required for final stage.'); return;
    }
    setSaving(true);
    try {
      const res = await api.post(`/assessors/${appraisalId}`, {
        name: name.trim(), email: email.trim() || null, institution: institution.trim(),
        assessor_type: assessorType, scope: scope || null, stage,
      });
      toast.success('Assessor added.');
      onAdded(res.data.assessor);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add assessor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Add {stage === 'final' ? 'Final Stage' : 'Initial Stage'} Assessor
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><LuX size={17} /></button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stage === 'initial' && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.8rem', color: '#3b82f6', lineHeight: 1.5 }}>
              Required composition: 1 external + 2 internal assessors
            </div>
          )}
          {stage === 'final' && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.8rem', color: '#6366f1', lineHeight: 1.5 }}>
              Submit 6 external names to VC (2 international + 4 national). VC selects 3.
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder="Dr. / Prof. Full Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email (optional)</label>
            <input type="email" className="form-input" placeholder="assessor@institution.edu" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Institution *</label>
            <input className="form-input" placeholder="University / Research Institute" value={institution} onChange={e => setInstitution(e.target.value)} />
          </div>

          {stage === 'initial' && (
            <div className="form-group">
              <label className="form-label">Assessor Type *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['external', 'internal'].map(t => (
                  <button key={t} onClick={() => setAssessorType(t)} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: `2px solid ${assessorType === t ? '#3b82f6' : 'var(--border)'}`, background: assessorType === t ? 'rgba(59,130,246,0.1)' : 'transparent', color: assessorType === t ? '#3b82f6' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(stage === 'final' || (stage === 'initial' && assessorType === 'external')) && isProfessorial && stage === 'final' && (
            <div className="form-group">
              <label className="form-label">Scope *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['international', 'national'].map(s => (
                  <button key={s} onClick={() => setScope(s)} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: `2px solid ${scope === s ? '#6366f1' : 'var(--border)'}`, background: scope === s ? 'rgba(99,102,241,0.1)' : 'transparent', color: scope === s ? '#6366f1' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button onClick={onClose} className="btn btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={save} className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add Assessor'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────── Assessor Panel (expanded row) ──────────────────────
const AssessorPanel = ({ candidate, onClose }) => {
  const [assessors, setAssessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(null); // 'initial' | 'final' | null
  const [outcomeTarget, setOutcomeTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/assessors/${candidate.id}`);
      setAssessors(res.data.assessors || []);
    } catch {
      toast.error('Failed to load assessors.');
    } finally {
      setLoading(false);
    }
  }, [candidate.id]);

  useEffect(() => { load(); }, [load]);

  const removeAssessor = async (id) => {
    if (!window.confirm('Remove this assessor?')) return;
    try {
      await api.delete(`/assessors/${id}`);
      setAssessors(prev => prev.filter(a => a.id !== id));
      toast.success('Assessor removed.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove.');
    }
  };

  const onAdded = (a) => setAssessors(prev => [...prev, a]);
  const onSaved = (updated) => setAssessors(prev => prev.map(a => a.id === updated.id ? updated : a));

  const rank = candidate.users?.current_rank;

  const initial = assessors.filter(a => a.stage === 'initial');
  const positiveInitial = initial.filter(a => a.outcome === 'positive').length;

  const renderAssessorTable = (list, stage) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid var(--border)' }}>
          {['Name', 'Institution', 'Type', stage === 'final' ? 'Scope' : null, stage === 'final' ? 'VC Selected' : null, 'Outcome', ''].filter(Boolean).map(h => (
            <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {list.length === 0 && (
          <tr><td colSpan={7} style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>No assessors added yet.</td></tr>
        )}
        {list.map(a => (
          <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>{a.name}</td>
            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{a.institution}</td>
            <td style={{ padding: '0.6rem 0.75rem' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: a.assessor_type === 'external' ? '#f59e0b' : '#8b5cf6', background: a.assessor_type === 'external' ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)', padding: '0.15rem 0.5rem', borderRadius: 10 }}>
                {a.assessor_type}
              </span>
            </td>
            {stage === 'final' && <td style={{ padding: '0.6rem 0.75rem' }}><ScopeBadge scope={a.scope} /></td>}
            {stage === 'final' && (
              <td style={{ padding: '0.6rem 0.75rem' }}>
                {a.selected_by_vc
                  ? <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '0.15rem 0.5rem', borderRadius: 10 }}>Selected</span>
                  : <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>—</span>}
              </td>
            )}
            <td style={{ padding: '0.6rem 0.75rem' }}>
              <OutcomeBadge outcome={a.outcome} />
            </td>
            <td style={{ padding: '0.6rem 0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {a.outcome === 'pending' ? (
                  <button onClick={() => setOutcomeTarget(a)} title="Record outcome" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '0.25rem' }}>
                    <LuCheckCircle2 size={15} />
                  </button>
                ) : (
                  <button
                    onClick={() => setOutcomeTarget(a)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                      borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer',
                      color: '#3b82f6', fontWeight: 700, fontSize: '0.725rem', whiteSpace: 'nowrap',
                    }}>
                    <LuFileText size={13} /> View Report
                  </button>
                )}
                {a.assessor_type === 'external' && (
                  <button
                    title="Copy portal link to share with assessor"
                    onClick={() => {
                      const url = `${window.location.origin}/assessor-portal/${a.id}`;
                      navigator.clipboard.writeText(url).then(() => toast.success('Portal link copied!'));
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: '0.25rem' }}>
                    <LuLink2 size={15} />
                  </button>
                )}
                {a.outcome === 'pending' && !a.selected_by_vc && (
                  <button onClick={() => removeAssessor(a.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}>
                    <LuTrash2 size={15} />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
      <LuLoader size={22} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--role-accent)', borderRadius: 'var(--radius)', padding: '1.5rem', marginTop: '0.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{candidate.users?.full_name}</div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{rank} — {candidate.users?.department}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><LuX size={18} /></button>
      </div>

      {/* ── Initial Stage ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Initial Assessment</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>1 external + 2 internal assessors</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {positiveInitial >= 2 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '0.25rem 0.75rem', borderRadius: 20 }}>
                ✓ 2+ Positive
              </span>
            )}
            {initial.length < 3 && (
              <button onClick={() => setShowAddModal('initial')} className="btn btn-primary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}>
                <LuPlus size={14} /> Add
              </button>
            )}
          </div>
        </div>
        {initial.length > 0 && progressBar(positiveInitial, initial.length)}
        <div style={{ marginTop: '0.75rem', overflowX: 'auto' }}>{renderAssessorTable(initial, 'initial')}</div>
      </div>

      {/* Final-stage professorial assessment (6-assessor VC selection, PFQ) is
          deliberately not surfaced here — that stage is confidential and handled
          entirely on paper, outside the system. */}

      {showAddModal && (
        <AddAssessorModal
          appraisalId={candidate.id}
          stage={showAddModal}
          rank={rank}
          onClose={() => setShowAddModal(null)}
          onAdded={onAdded}
        />
      )}
      {outcomeTarget && (
        <OutcomeModal
          assessor={outcomeTarget}
          onClose={() => setOutcomeTarget(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
};

// ─────────────────────── Main Page ──────────────────────────────────────────
const DeanAssessorsPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [year, setYear]             = useState('');
  const [search, setSearch]         = useState('');
  const [expanded, setExpanded]     = useState(null);

  useEffect(() => {
    const params = {};
    if (year) params.appraisal_year = year;
    api.get('/assessors/candidates', { params })
      .then(res => setCandidates(res.data.candidates || []))
      .catch(() => toast.error('Failed to load candidates.'))
      .finally(() => setLoading(false));
  }, [year]);

  const filtered = candidates.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.users?.full_name?.toLowerCase().includes(q) || c.users?.staff_id?.toLowerCase().includes(q);
  });

  return (
    <div className="page-container stagger-children">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>External Assessors</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Assign and track external assessors for Senior Lecturer, Associate Professor, and Professor promotion candidates.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <LuSearch size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search by name or staff ID…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, margin: 0 }} />
        </div>
        <input type="number" className="form-input" placeholder="Year" value={year} onChange={e => setYear(e.target.value)} style={{ width: 110, margin: 0 }} min={2020} max={2100} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuLoader size={26} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '3rem', textAlign: 'center' }}>
          <LuUsers size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No eligible candidates found for external assessment.</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem', marginTop: '0.4rem' }}>Candidates at Lecturer I, Senior Lecturer, and Associate Professor ranks appear here after College Board review.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(c => {
            const isOpen = expanded === c.id;
            const rank   = c.users?.current_rank;
            return (
              <div key={c.id}>
                <div style={{ background: 'var(--bg-card)', border: `1px solid ${isOpen ? 'var(--role-accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', transition: 'border-color 0.2s', cursor: 'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="avatar" style={{ width: 38, height: 38, flexShrink: 0 }}>
                    {(c.users?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.users?.full_name}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{c.users?.staff_id} · {c.users?.department}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.775rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>{rank}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {isOpen ? <LuChevronUp size={18} /> : <LuChevronDown size={18} />}
                  </div>
                </div>
                {isOpen && (
                  <AssessorPanel candidate={c} onClose={() => setExpanded(null)} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeanAssessorsPage;
