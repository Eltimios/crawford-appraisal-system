import { useState, useEffect } from 'react';
import { LuAlertCircle, LuLoader, LuCheckCircle2 } from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../services/api';

const RegistryDisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [resolutions, setResolutions] = useState({});
  const [resolving, setResolving] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/registry/disputes')
      .then(res => setDisputes(res.data.disputes || []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleResolve = async (appraisalId) => {
    if (!resolutions[appraisalId]?.trim()) {
      toast.error('Please enter a resolution comment.');
      return;
    }
    setResolving(appraisalId);
    try {
      await api.put(`/registry/disputes/${appraisalId}/resolve`, {
        resolution: resolutions[appraisalId],
      });
      toast.success('Invalidation resolved. Staff has been notified.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resolve invalidation.');
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
          Invalidations
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
          Non-teaching staff invalidations awaiting Registry resolution.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuLoader size={22} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : disputes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuCheckCircle2 size={40} style={{ marginBottom: '0.75rem', opacity: 0.35 }} />
          <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>No invalidations</p>
          <p style={{ fontSize: '0.825rem', margin: 0 }}>No invalidations are currently pending resolution.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {disputes.map(d => {
            const isOpen = expanded === d.id;
            const staff = d.users;
            return (
              <div key={d.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div
                  onClick={() => setExpanded(isOpen ? null : d.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
                >
                  <LuAlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{staff?.full_name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {staff?.department} · {d.appraisal_year || '—'}
                    </div>
                  </div>
                  <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                    Invalidation
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem', background: 'var(--bg-secondary)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
                        Staff's Invalidation Comment
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', background: 'rgba(239,68,68,0.06)', padding: '0.75rem', borderRadius: 8, borderLeft: '3px solid #ef4444' }}>
                        {d.staff_comment || 'No comment provided.'}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Resolution *</label>
                      <textarea
                        rows={4}
                        className="form-input"
                        placeholder="Enter your resolution comment…"
                        value={resolutions[d.id] || ''}
                        onChange={e => setResolutions(prev => ({ ...prev, [d.id]: e.target.value }))}
                        disabled={resolving === d.id}
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <button
                      onClick={() => handleResolve(d.id)}
                      disabled={resolving === d.id}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {resolving === d.id
                        ? <><LuLoader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Resolving…</>
                        : <><LuCheckCircle2 size={14} /> Resolve Invalidation</>
                      }
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RegistryDisputesPage;
