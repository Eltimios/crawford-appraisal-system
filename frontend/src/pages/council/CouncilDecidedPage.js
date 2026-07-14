import { useState, useEffect } from 'react';
import { getCouncilDecisions } from '../../services/appraisalService';

const YEAR = '2025/2026';

const DECISION_BADGE = {
  approved: { label: 'Approved',  className: 'badge-success' },
  rejected: { label: 'Rejected',  className: 'badge-danger' },
  deferred: { label: 'Deferred',  className: 'badge-warning' },
};

const APC_LABELS = {
  promoted:    'Promotion',
  increment:   'Increment',
  both:        'Promotion + Increment',
  deferred:    'Deferred',
  not_eligible:'Not Eligible',
};

const CATEGORY_LABEL = {
  academic:           'Academic',
  junior_nonteaching: 'Junior Non-Teaching',
  senior_nonteaching: 'Senior Non-Teaching',
};

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ active, onChange, counts }) => (
  <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
    {[
      { key: 'academic',    label: 'Academic',     count: counts.academic },
      { key: 'nonteaching', label: 'Non-Teaching', count: counts.nonteaching },
    ].map(t => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        style={{
          padding: '0.625rem 1.25rem',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontWeight: active === t.key ? 700 : 500,
          fontSize: '0.9rem',
          color: active === t.key ? 'var(--role-accent)' : 'var(--text-secondary)',
          borderBottom: active === t.key ? '2px solid var(--role-accent)' : '2px solid transparent',
          marginBottom: -2,
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {t.label}
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          background: active === t.key ? 'var(--role-accent-dim)' : 'var(--bg-hover)',
          color: active === t.key ? 'var(--role-accent)' : 'var(--text-muted)',
          padding: '0.1rem 0.45rem',
          borderRadius: 99,
        }}>
          {t.count}
        </span>
      </button>
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const CouncilDecidedPage = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('academic');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCouncilDecisions(YEAR)
      .then(setAppraisals)
      .catch(() => setAppraisals([]))
      .finally(() => setLoading(false));
  }, []);

  const academic    = appraisals.filter(a => a.category === 'academic');
  const nonteaching = appraisals.filter(a => a.category !== 'academic');

  const baseList = activeTab === 'academic' ? academic : nonteaching;

  const filtered = baseList.filter(a => {
    const matchDecision = decisionFilter === 'all' || a.councilDecision?.decision === decisionFilter;
    const q = search.toLowerCase();
    const staff = a.part1 || {};
    const matchSearch = !search || (
      `${staff.surname} ${staff.firstName}`.toLowerCase().includes(q) ||
      (staff.staffId || '').toLowerCase().includes(q)
    );
    return matchDecision && matchSearch;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Council Decision Records</h1>
        <p className="page-subtitle">Final University Council decisions on staff appraisals — {YEAR}.</p>
      </div>

      <TabBar
        active={activeTab}
        onChange={tab => { setActiveTab(tab); setDecisionFilter('all'); setSearch(''); }}
        counts={{ academic: academic.length, nonteaching: nonteaching.length }}
      />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          placeholder="Search by name or staff ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { value: 'all',      label: 'All' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'deferred', label: 'Deferred' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setDecisionFilter(f.value)}
              className={`btn btn-sm ${decisionFilter === f.value ? 'btn-primary' : 'btn-secondary'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">
              {baseList.length === 0 ? 'No decisions recorded yet for this category' : 'No results match your filter'}
            </div>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Department</th>
                <th>{activeTab === 'nonteaching' ? 'Sub-Category' : 'Rank'}</th>
                <th>A&amp;PC Recommendation</th>
                <th>Council Decision</th>
                <th>Decided</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const staff = a.part1 || {};
                const apc = a.apcDecision || {};
                const council = a.councilDecision || {};
                const badge = DECISION_BADGE[council.decision] || { label: council.decision, className: 'badge-secondary' };
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {staff.surname} {staff.firstName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{staff.staffId}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{staff.department || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {activeTab === 'nonteaching'
                        ? <span className="badge badge-secondary">{CATEGORY_LABEL[a.category] || a.category}</span>
                        : (staff.rank || '—')
                      }
                    </td>
                    <td>
                      <span className="badge badge-primary">{APC_LABELS[apc.decision] || apc.decision || '—'}</span>
                    </td>
                    <td>
                      <span className={`badge ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {council.decided_at
                        ? new Date(council.decided_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', maxWidth: 200 }}>
                      {council.notes
                        ? <span title={council.notes} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{council.notes}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CouncilDecidedPage;
