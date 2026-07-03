import { useState, useEffect, useCallback } from 'react';
import {
  LuLoader, LuGlobe, LuBuilding2, LuCheckCircle2, LuX,
  LuUsers, LuBadge,
} from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PROFESSORIAL_RANKS = ['Senior Lecturer', 'Associate Professor'];

const ScopeBadge = ({ scope }) => {
  const isIntl = scope === 'international';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.55rem', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: isIntl ? 'rgba(99,102,241,0.12)' : 'rgba(14,165,233,0.12)', color: isIntl ? '#6366f1' : '#0ea5e9', whiteSpace: 'nowrap' }}>
      {isIntl ? <LuGlobe size={11} /> : <LuBuilding2 size={11} />}
      {isIntl ? 'International' : 'National'}
    </span>
  );
};

const CandidateCard = ({ candidate, onUpdated }) => {
  const [assessors, setAssessors] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/assessors/${candidate.id}`);
      setAssessors((res.data.assessors || []).filter(a => a.stage === 'final'));
    } catch {
      toast.error('Failed to load assessors for this candidate.');
    } finally {
      setLoading(false);
    }
  }, [candidate.id]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = async (assessor) => {
    setToggling(assessor.id);
    try {
      const res = await api.patch(`/assessors/vc/select/${assessor.id}`, { selected: !assessor.selected_by_vc });
      setAssessors(prev => prev.map(a => a.id === assessor.id ? res.data.assessor : a));
      toast.success(res.data.assessor.selected_by_vc ? 'Assessor selected.' : 'Selection removed.');
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update selection.');
    } finally {
      setToggling(null);
    }
  };

  const selected    = assessors.filter(a => a.selected_by_vc);
  const intlSel     = selected.filter(a => a.scope === 'international').length;
  const natSel      = selected.filter(a => a.scope === 'national').length;
  const selComplete = intlSel === 1 && natSel === 2;

  const s = candidate.users;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="avatar" style={{ width: 44, height: 44, flexShrink: 0 }}>
          {(s?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{s?.full_name}</div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{s?.staff_id} · {s?.department}</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>{s?.current_rank}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>PFQ Established</span>
            {selComplete && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>Selection Complete</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: selComplete ? '#10b981' : 'var(--text-primary)' }}>{selected.length}/3</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>selected</div>
        </div>
      </div>

      {/* Selection quota */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ padding: '0.35rem 0.875rem', borderRadius: 20, fontSize: '0.775rem', fontWeight: 700, background: intlSel >= 1 ? 'rgba(99,102,241,0.12)' : 'var(--bg-hover)', color: intlSel >= 1 ? '#6366f1' : 'var(--text-muted)' }}>
          {intlSel}/1 International
        </div>
        <div style={{ padding: '0.35rem 0.875rem', borderRadius: 20, fontSize: '0.775rem', fontWeight: 700, background: natSel >= 2 ? 'rgba(14,165,233,0.12)' : 'var(--bg-hover)', color: natSel >= 2 ? '#0ea5e9' : 'var(--text-muted)' }}>
          {natSel}/2 National
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
          <LuLoader size={20} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : assessors.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
          Dean has not submitted external assessor names yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {assessors.map(a => {
            const isSel = a.selected_by_vc;
            const isToggling = toggling === a.id;

            // Can this one be selected?
            const canSelect = !isSel && (
              (a.scope === 'international' && intlSel < 1) ||
              (a.scope === 'national' && natSel < 2)
            ) && selected.length < 3;

            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 10, border: `2px solid ${isSel ? '#10b981' : 'var(--border)'}`, background: isSel ? 'rgba(16,185,129,0.06)' : 'var(--bg-secondary)', transition: 'all 0.2s' }}>
                <ScopeBadge scope={a.scope} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{a.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.institution}</div>
                </div>
                {isSel && (
                  <LuCheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                )}
                <button
                  onClick={() => toggleSelect(a)}
                  disabled={isToggling || (!isSel && !canSelect)}
                  style={{
                    padding: '0.4rem 0.875rem', borderRadius: 8, border: `1.5px solid ${isSel ? '#ef4444' : '#10b981'}`,
                    background: isSel ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                    color: isSel ? '#ef4444' : '#10b981',
                    fontWeight: 700, fontSize: '0.775rem', cursor: (!isSel && !canSelect) ? 'not-allowed' : 'pointer',
                    opacity: (!isSel && !canSelect) ? 0.4 : 1, flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {isToggling ? <LuLoader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : isSel ? <><LuX size={13} /> Deselect</> : <><LuCheckCircle2 size={13} /> Select</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const VCAssessorsPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [year, setYear]             = useState('');

  const load = useCallback(() => {
    const params = {};
    if (year) params.appraisal_year = year;
    api.get('/assessors/vc/pending', { params })
      .then(res => setCandidates(res.data.candidates || []))
      .catch(() => toast.error('Failed to load candidates.'))
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page-container stagger-children">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Final External Assessor Selection</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Select 3 external assessors (1 international + 2 national) from the 6 names submitted by the Dean for each professorial promotion candidate.
        </p>
      </div>

      {/* Year filter */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <input type="number" className="form-input" placeholder="Filter by year" value={year} onChange={e => setYear(e.target.value)} style={{ width: 150, margin: 0 }} min={2020} max={2100} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuLoader size={26} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : candidates.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '3rem', textAlign: 'center' }}>
          <LuUsers size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No professorial candidates awaiting assessor selection.</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem', marginTop: '0.4rem' }}>
            Candidates appear here when A&PC establishes PFQ and the Dean submits 6 external names.
          </div>
        </div>
      ) : (
        candidates.map(c => (
          <CandidateCard key={c.id} candidate={c} onUpdated={load} />
        ))
      )}
    </div>
  );
};

export default VCAssessorsPage;
