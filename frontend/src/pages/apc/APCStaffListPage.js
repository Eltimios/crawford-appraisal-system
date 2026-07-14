import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuSearch, LuArrowLeft, LuUser, LuBuilding2, LuBadge, LuLoader, LuFilter } from 'react-icons/lu';
import api from '../../services/api';

const statusColors = {
  hod_assessed: '#f59e0b', reporting_officer_assessed: '#f59e0b',
  registry_validated: '#8b5cf6', college_board_approved: '#8b5cf6',
  apc_recommended: '#10b981', completed: '#10b981',
  dispute_raised: '#ef4444', disputed: '#ef4444', dean_resolved: '#06b6d4',
};

const statusLabel = (s) =>
  s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Not Submitted';

const APCStaffListPage = ({ title, category, type, backPath, detailPathPrefix = '/apc/staff' }) => {
  const navigate = useNavigate();
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const searchRef = useRef(null);

  const load = (q = '') => {
    setLoading(true);
    setLoadError('');
    const params = { category, q: q || undefined };
    if (type) params.type = type;
    api.get('/promotions/eligible', { params })
      .then(res => setAppraisals(res.data.appraisals || []))
      .catch(err => {
        const msg = err.response?.data?.error || err.response?.statusText || err.message || 'Failed to load';
        setLoadError(`${err.response?.status || ''} ${msg}`.trim());
        setAppraisals([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [category, type]);

  const handleSearch = (e) => {
    setQuery(e.target.value);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => load(e.target.value), 350);
  };

  const displayed = showRecommendedOnly
    ? appraisals.filter(a => a.apc_decision !== null)
    : appraisals;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {backPath && (
          <button
            onClick={() => navigate(backPath)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.825rem', padding: 0 }}
          >
            <LuArrowLeft size={15} /> Back
          </button>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem' }}>
            {loading ? 'Loading…' : `${displayed.length} staff eligible for review`}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 400 }}>
          <LuSearch size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={query} onChange={handleSearch} placeholder="Search by name or staff ID…" className="form-input" style={{ paddingLeft: '2.375rem' }} />
        </div>
        <button
          onClick={() => setShowRecommendedOnly(!showRecommendedOnly)}
          className={`btn ${showRecommendedOnly ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', flexShrink: 0 }}
        >
          <LuFilter size={13} />
          {showRecommendedOnly ? 'Recommended only' : 'All eligible'}
        </button>
      </div>

      {loadError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <span>Could not load staff: {loadError}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuLoader size={22} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuUser size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>{query ? `No staff found for "${query}"` : 'No eligible staff at this time.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {displayed.map(a => {
            const s = a.users;
            const status = a.status;
            const color = statusColors[status] || '#6b7280';
            const hasDecision = !!a.apc_decision;

            return (
              <div
                key={a.id}
                onClick={() => navigate(`${detailPathPrefix}/${a.staff_id}`, { state: { appraisalId: a.id } })}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '1.25rem',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--role-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div className="avatar" style={{ width: 40, height: 40, flexShrink: 0 }}>
                    {(s?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s?.full_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{s?.staff_id || '—'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  {s?.department && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><LuBuilding2 size={12} /> {s.department}</span>}
                  {s?.current_rank && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><LuBadge size={12} /> {s.current_rank}</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: `${color}22`, color }}>
                    {statusLabel(status)}
                  </span>
                  {hasDecision ? (
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                      Recommended
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--role-accent)', fontWeight: 600 }}>
                      Review →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default APCStaffListPage;
