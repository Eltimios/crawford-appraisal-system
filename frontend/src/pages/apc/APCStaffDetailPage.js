import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  LuArrowLeft, LuUser, LuBuilding2, LuBadge, LuLoader,
  LuTrendingUp, LuCoins, LuCheckCircle2, LuClock, LuX,
  LuShield,
} from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ASSESSOR_RANKS     = ['Lecturer I', 'Senior Lecturer', 'Associate Professor'];

const OutcomeDot = ({ outcome }) => {
  const colors = { positive: '#10b981', negative: '#ef4444', pending: '#6b7280' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[outcome] || colors.pending, flexShrink: 0 }} />;
};

// Only the Initial Assessment stage is surfaced here — the professorial
// promotion track's second stage (PFQ, VC-selected final assessors) is
// confidential and handled entirely on paper, outside the system.
const AssessorStatusSection = ({ appraisalId }) => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/assessors/${appraisalId}`);
      setData(res.data);
    } catch {
      // silently fail — assessor section is supplemental
    } finally {
      setLoading(false);
    }
  }, [appraisalId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: 8 }}><LuLoader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading assessor data…</div>;
  if (!data) return null;

  const assessors = data.assessors || [];
  const initial   = assessors.filter(a => a.stage === 'initial');
  const posInit   = initial.filter(a => a.outcome === 'positive').length;

  const AssessorRow = ({ a }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
      <OutcomeDot outcome={a.outcome} />
      <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>{a.name}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{a.institution}</span>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 10, background: a.assessor_type === 'external' ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)', color: a.assessor_type === 'external' ? '#d97706' : '#7c3aed' }}>{a.assessor_type}</span>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.25rem' }}>
      <h3 style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <LuShield size={16} style={{ color: 'var(--role-accent)' }} /> External Assessors
      </h3>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Initial Assessment (1 external + 2 internal)</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: posInit >= 2 ? '#10b981' : 'var(--text-muted)' }}>{posInit}/3 positive {posInit >= 2 ? '✓' : ''}</div>
        </div>
        {initial.length === 0
          ? <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No assessors assigned by Dean yet.</div>
          : initial.map(a => <AssessorRow key={a.id} a={a} />)}
      </div>
    </div>
  );
};

const RECOMMENDATION_OPTIONS = [
  { value: 'promoted', label: 'Recommend for Promotion', color: '#10b981', icon: <LuTrendingUp size={16} /> },
  { value: 'increment', label: 'Recommend for Increment', color: '#3b82f6', icon: <LuCoins size={16} /> },
  { value: 'both', label: 'Recommend for Both', color: '#f59e0b', icon: <LuCheckCircle2 size={16} /> },
  { value: 'deferred', label: 'Defer', color: '#6b7280', icon: <LuClock size={16} /> },
  { value: 'not_eligible', label: 'Not Eligible', color: '#ef4444', icon: <LuX size={16} /> },
];

const APCStaffDetailPage = () => {
  const { staffId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const [appraisal, setAppraisal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const appraisalId = location.state?.appraisalId;

  useEffect(() => {
    if (!appraisalId) { navigate(-1); return; }
    api.get('/promotions/eligible')
      .then(res => {
        const found = (res.data.appraisals || []).find(a => a.id === appraisalId);
        // Also include already-decided
        if (!found) return api.get('/promotions/decisions').then(r => {
          const d = (r.data.appraisals || []).find(a => a.id === appraisalId);
          setAppraisal(d || null);
        });
        setAppraisal(found);
      })
      .catch(() => setAppraisal(null))
      .finally(() => setLoading(false));
  }, [appraisalId]);

  const handleRecommend = async () => {
    if (!selected) { toast.error('Please select a recommendation.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/promotions/appraisals/${appraisalId}/recommend`, { decision: selected, notes });
      toast.success('Recommendation recorded. This is the final decision for this appraisal cycle.');
      setShowModal(false);
      // Refresh
      api.get('/promotions/eligible')
        .then(res => {
          const found = (res.data.appraisals || []).find(a => a.id === appraisalId);
          if (found) setAppraisal(found);
        }).catch(() => {});
      // Navigate back after short delay
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record recommendation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, color: 'var(--text-muted)' }}>
      <LuLoader size={28} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (!appraisal) return (
    <div className="page-container">
      <p style={{ color: 'var(--text-muted)' }}>Appraisal not found.</p>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginTop: '1rem' }}>Go Back</button>
    </div>
  );

  const s = appraisal.users;
  const hasDecision = !!appraisal.apc_decision;
  const decision = appraisal.apc_decision;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.825rem', padding: 0, marginBottom: '1.5rem' }}>
        <LuArrowLeft size={15} /> Back to Staff List
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Staff Info Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="avatar" style={{ width: 52, height: 52, fontSize: '1rem' }}>
              {(s?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{s?.full_name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s?.staff_id}</div>
            </div>
          </div>
          {[
            { icon: <LuBuilding2 size={14} />, label: 'Department', value: s?.department },
            { icon: <LuBadge size={14} />, label: 'Grade Level', value: s?.current_rank },
            { icon: <LuUser size={14} />, label: 'Category', value: s?.staff_category?.replace(/_/g, ' ') },
          ].map(row => row.value && (
            <div key={row.label} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }}>{row.icon}</span>
              <span style={{ color: 'var(--text-muted)', minWidth: 90, flexShrink: 0 }}>{row.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Appraisal Assessment Summary */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Assessment Summary</h3>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Year:</strong> {appraisal.appraisal_year || '—'}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Status:</strong>{' '}
            {appraisal.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </div>
          {appraisal.hod_recommendation && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
                Assessor's Recommendation
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: 8, borderLeft: '3px solid var(--role-accent)', lineHeight: 1.6 }}>
                {appraisal.hod_recommendation}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* External Assessors section — shown for Lecturer I, Senior Lecturer, Associate Professor */}
      {ASSESSOR_RANKS.includes(s?.current_rank) && appraisalId && (
        <AssessorStatusSection
          appraisalId={appraisalId}
          currentRank={s?.current_rank}
          role={userRole}
        />
      )}

      {/* A&PC Decision section */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>A&PC Recommendation</h3>

        {hasDecision ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ padding: '0.35rem 0.875rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                {decision.decision?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.2rem 0.6rem', background: 'rgba(251,191,36,0.12)', color: '#f59e0b', borderRadius: 20, fontWeight: 600 }}>
                Pending Council Approval
              </span>
            </div>
            {decision.notes && (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: 8, margin: 0 }}>
                {decision.notes}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              No recommendation has been submitted yet. Review the assessment above and submit your recommendation.
            </p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              Submit Recommendation
            </button>
          </div>
        )}
      </div>

      {/* Recommendation Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', width: '100%', maxWidth: 480,
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Submit A&PC Recommendation</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><LuX size={17} /></button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Recommending for: <strong style={{ color: 'var(--text-primary)' }}>{s?.full_name}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {RECOMMENDATION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelected(opt.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', borderRadius: 10, border: `2px solid`,
                      borderColor: selected === opt.value ? opt.color : 'var(--border)',
                      background: selected === opt.value ? `${opt.color}12` : 'transparent',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      color: selected === opt.value ? opt.color : 'var(--text-secondary)',
                      fontSize: '0.875rem', fontWeight: selected === opt.value ? 700 : 500,
                    }}
                  >
                    <span style={{ color: opt.color }}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea rows={3} className="form-input" placeholder="Add supporting notes…"
                  value={notes} onChange={e => setNotes(e.target.value)} disabled={submitting}
                  style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" disabled={submitting}>Cancel</button>
                <button onClick={handleRecommend} className="btn btn-primary" disabled={submitting || !selected}>
                  {submitting ? 'Submitting…' : 'Submit Recommendation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APCStaffDetailPage;
