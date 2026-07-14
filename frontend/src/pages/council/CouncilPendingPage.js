import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCouncilPending, recordCouncilDecision } from '../../services/appraisalService';

const YEAR = '2025/2026';

const APC_DECISION_LABELS = {
  promoted:    'Recommend Promotion',
  increment:   'Recommend Increment',
  both:        'Recommend Promotion + Increment',
  deferred:    'Deferred by A&PC',
  not_eligible:'Not Eligible (A&PC)',
};

const COUNCIL_DECISIONS = [
  { value: 'approved', label: 'Approve',  description: 'Approve the A&PC recommendation', color: '#10b981' },
  { value: 'rejected', label: 'Reject',   description: 'Reject the recommendation',       color: '#ef4444' },
  { value: 'deferred', label: 'Defer',    description: 'Defer to next appraisal cycle',   color: '#f59e0b' },
];

const CATEGORY_LABEL = {
  academic:           'Academic',
  junior_nonteaching: 'Junior Non-Teaching',
  senior_nonteaching: 'Senior Non-Teaching',
};

const isAcademic = (a) => a.category === 'academic';

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ active, onChange, counts }) => (
  <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
    {[
      { key: 'academic',     label: 'Academic',    count: counts.academic },
      { key: 'nonteaching',  label: 'Non-Teaching', count: counts.nonteaching },
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

// ─── Staff table ──────────────────────────────────────────────────────────────
const StaffTable = ({ appraisals, onSelect }) => {
  if (appraisals.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">🏛️</div>
          <div className="empty-state-title">No pending decisions in this category</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            All appraisals here have been reviewed, or none have A&PC recommendations yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Staff</th>
            <th>Department</th>
            <th>Rank</th>
            <th>Category</th>
            <th>A&amp;PC Recommendation</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {appraisals.map(a => {
            const staff = a.part1 || {};
            const apc = a.apcDecision || {};
            return (
              <tr key={a.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {staff.surname} {staff.firstName}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{staff.staffId}</div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{staff.department || '—'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{staff.rank || '—'}</td>
                <td><span className="badge badge-secondary">{CATEGORY_LABEL[a.category] || a.category}</span></td>
                <td>
                  <span className="badge badge-primary">
                    {APC_DECISION_LABELS[apc.decision] || apc.decision || '—'}
                  </span>
                </td>
                <td>
                  <button onClick={() => onSelect(a)} className="btn btn-primary btn-sm">
                    Give Decision
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Decision detail view ─────────────────────────────────────────────────────
const DecisionView = ({ selected, onBack, onSubmit, submitting, error }) => {
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const staff = selected.part1 || {};
  const apc = selected.apcDecision || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', marginBottom: '0.75rem', padding: 0 }}
        >
          ← Back to list
        </button>
        <h1 className="page-title">Council Decision: {staff.surname} {staff.firstName}</h1>
        <p className="page-subtitle">{staff.department} · {staff.rank} · {selected.year}</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}><span>{error}</span></div>}

      {/* A&PC Recommendation */}
      <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--role-accent)' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>A&amp;PC Recommendation</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Decision</div>
            <span className="badge badge-primary" style={{ fontSize: '0.875rem', padding: '0.375rem 0.875rem' }}>
              {APC_DECISION_LABELS[apc.decision] || apc.decision || '—'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Recommended By</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{apc.recommended_by || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Date</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {apc.decidedAt ? new Date(apc.decidedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>
        {apc.notes && (
          <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--bg-hover)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.375rem' }}>A&amp;PC Notes</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>{apc.notes}</p>
          </div>
        )}
      </div>

      {/* Staff Profile */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Staff Profile</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Staff ID', value: staff.staffId },
            { label: 'Department', value: staff.department },
            { label: 'College', value: staff.college },
            { label: 'Current Rank', value: staff.rank },
            { label: 'Category', value: CATEGORY_LABEL[selected.category] || selected.category },
            { label: 'First Appointment', value: staff.dateOfFirstAppointment || '—' },
            { label: 'Last Promotion', value: staff.dateOfLastPromotion || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Council Decision */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Council Final Decision</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          As the University Council, your decision is final and will be communicated to the staff member.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {COUNCIL_DECISIONS.map(d => (
            <button
              key={d.value}
              onClick={() => setDecision(d.value)}
              style={{
                padding: '0.875rem 1.5rem',
                borderRadius: 10,
                border: '2px solid',
                borderColor: decision === d.value ? d.color : 'var(--border)',
                background: decision === d.value ? `${d.color}18` : 'transparent',
                color: decision === d.value ? d.color : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                minWidth: 160,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{d.label}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.8 }}>{d.description}</div>
            </button>
          ))}
        </div>
        <div className="form-group">
          <label className="form-label">Notes / Justification</label>
          <textarea
            className="form-input"
            rows={4}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Provide any remarks or justification for this decision (optional)…"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={onBack} className="btn btn-secondary">Cancel</button>
        <button
          onClick={() => onSubmit(selected, decision, notes)}
          disabled={submitting || !decision}
          className="btn btn-primary"
        >
          {submitting ? 'Submitting…' : 'Submit Council Decision'}
        </button>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const CouncilPendingPage = () => {
  const location = useLocation();
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'academic');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCouncilPending(YEAR)
      .then(setAppraisals)
      .catch(() => setAppraisals([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (appraisal, decision, notes) => {
    if (!decision) { setError('Please select a council decision.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await recordCouncilDecision(appraisal.id, decision, notes);
      setAppraisals(prev => prev.filter(a => a.id !== appraisal.id));
      setSelected(null);
      setSuccessMsg('Council decision recorded successfully.');
    } catch {
      setError('Failed to record decision. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const academic    = appraisals.filter(a => isAcademic(a));
  const nonteaching = appraisals.filter(a => !isAcademic(a));

  const activeList = (activeTab === 'academic' ? academic : nonteaching).filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    const staff = a.part1 || {};
    return (
      `${staff.surname} ${staff.firstName}`.toLowerCase().includes(q) ||
      (staff.staffId || '').toLowerCase().includes(q) ||
      (staff.department || '').toLowerCase().includes(q)
    );
  });

  if (selected) {
    return (
      <DecisionView
        selected={selected}
        onBack={() => { setSelected(null); setError(''); }}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
      />
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Pending Council Decisions</h1>
        <p className="page-subtitle">
          Staff appraisals with A&amp;PC recommendations awaiting final University Council approval.
        </p>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <span>{successMsg}</span>
        </div>
      )}

      <TabBar
        active={activeTab}
        onChange={tab => { setActiveTab(tab); setSearch(''); }}
        counts={{ academic: academic.length, nonteaching: nonteaching.length }}
      />

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      ) : (
        <>
          <div style={{ marginBottom: '1.25rem' }}>
            <input
              className="form-input"
              style={{ maxWidth: 340 }}
              placeholder="Search by name, staff ID, or department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <StaffTable appraisals={activeList} onSelect={a => { setSelected(a); setError(''); setSuccessMsg(''); }} />
        </>
      )}
    </div>
  );
};

export default CouncilPendingPage;
