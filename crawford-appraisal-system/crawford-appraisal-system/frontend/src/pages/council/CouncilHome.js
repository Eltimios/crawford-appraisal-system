import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCouncilStats } from '../../services/appraisalService';
import { LuInbox, LuCheckCircle2, LuXCircle, LuClock, LuGavel, LuGraduationCap, LuUsers, LuScrollText } from 'react-icons/lu';
import WelcomeBanner from '../../components/ui/WelcomeBanner';

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="card-stat animate-fade-in">
    <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
    </div>
  </div>
);

// Section heading for category groups
const SectionHeading = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem', marginTop: '0.25rem' }}>
    <span style={{ color: 'var(--role-accent)' }}>{icon}</span>
    <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
      {title}
    </h3>
  </div>
);

const CouncilHome = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCouncilStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const s = stats || {};
  const v = (key) => loading ? '…' : (s[key] ?? 0);

  return (
    <div className="page-container stagger-children">
      <WelcomeBanner
        name={userProfile?.full_name || 'Council'}
        subtitle="Review A&PC recommendations and give final approval decisions on staff appraisals."
      />

      {/* ── Pending decisions ── */}
      <SectionHeading icon={<LuInbox size={16} />} title="Pending Council Decisions" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard
          icon={<LuGraduationCap size={20} />}
          label="Academic — Pending"
          value={v('pending_academic')}
          color="#3b82f6"
          sub="Teaching staff awaiting decision"
        />
        <StatCard
          icon={<LuUsers size={20} />}
          label="Non-Teaching — Pending"
          value={v('pending_nonteaching')}
          color="#8b5cf6"
          sub="Non-teaching staff awaiting decision"
        />
        <StatCard
          icon={<LuInbox size={20} />}
          label="Total Pending"
          value={v('pending')}
          color="#f59e0b"
        />
      </div>

      {/* ── Decisions made ── */}
      <SectionHeading icon={<LuGavel size={16} />} title="Decisions Made" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard
          icon={<LuCheckCircle2 size={20} />}
          label="Approved"
          value={v('approved')}
          color="#10b981"
          sub={`Academic: ${v('approved_academic')} · Non-Teaching: ${v('approved_nonteaching')}`}
        />
        <StatCard
          icon={<LuXCircle size={20} />}
          label="Rejected"
          value={v('rejected')}
          color="#ef4444"
        />
        <StatCard
          icon={<LuClock size={20} />}
          label="Deferred"
          value={v('deferred')}
          color="#f59e0b"
        />
      </div>

      {/* ── Quick actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Academic */}
        <div className="card animate-fade-in" style={{ borderTop: '3px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <LuGraduationCap size={22} color="#3b82f6" />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Academic Staff</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Review and approve A&PC promotion recommendations for teaching/academic staff.
          </p>
          {!loading && (s.pending_academic ?? 0) > 0 && (
            <span className="badge badge-warning" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
              {s.pending_academic} pending
            </span>
          )}
          {!loading && (s.pending_academic ?? 0) === 0 && (
            <span className="badge badge-success" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
              All up to date
            </span>
          )}
          <br />
          <button
            onClick={() => navigate('/council/pending', { state: { tab: 'academic' } })}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '0.75rem' }}
          >
            <LuGavel size={14} style={{ marginRight: '0.375rem' }} />
            Review Academic →
          </button>
        </div>

        {/* Non-Teaching */}
        <div className="card animate-fade-in" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <LuUsers size={22} color="#8b5cf6" />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Non-Teaching Staff</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Review and approve A&PC promotion recommendations for junior and senior non-teaching staff.
          </p>
          {!loading && (s.pending_nonteaching ?? 0) > 0 && (
            <span className="badge badge-warning" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
              {s.pending_nonteaching} pending
            </span>
          )}
          {!loading && (s.pending_nonteaching ?? 0) === 0 && (
            <span className="badge badge-success" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
              All up to date
            </span>
          )}
          <br />
          <button
            onClick={() => navigate('/council/pending', { state: { tab: 'nonteaching' } })}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '0.75rem', background: '#8b5cf6', borderColor: '#8b5cf6' }}
          >
            <LuGavel size={14} style={{ marginRight: '0.375rem' }} />
            Review Non-Teaching →
          </button>
        </div>

        {/* Records */}
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📋</span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Decision Records</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            View all final decisions — approved promotions, rejections, and deferrals.
          </p>
          {!loading && stats && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span className="badge badge-success">{s.approved ?? 0} Approved</span>
              <span className="badge badge-danger">{s.rejected ?? 0} Rejected</span>
              <span className="badge badge-warning">{s.deferred ?? 0} Deferred</span>
            </div>
          )}
          <button onClick={() => navigate('/council/decided')} className="btn btn-secondary btn-sm">
            View All Records →
          </button>
        </div>

        {/* Meeting Minutes */}
        <div className="card animate-fade-in" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <LuScrollText size={22} color="#8b5cf6" />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Meeting Minutes</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Upload Council meeting minutes and view all minutes from College Board, A&PC, and Council levels. System flags any discrepancies — Council has final say.
          </p>
          <button onClick={() => navigate('/council/minutes')} className="btn btn-primary btn-sm"
            style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
            <LuScrollText size={14} style={{ marginRight: '0.375rem' }} />
            Manage Minutes →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouncilHome;
