import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LuClipboardCheck, LuAlertCircle, LuCheckCircle2,
  LuUserCheck, LuArrowRight, LuUsers, LuBarChart2, LuAward,
} from 'react-icons/lu';
import WelcomeBanner from '../../components/ui/WelcomeBanner';
import api from '../../services/api';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card-stat animate-fade-in">
    <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const HubCard = ({ title, subtitle, icon, color, badge, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '2rem 1.75rem',
      cursor: 'pointer', transition: 'all 0.2s ease',
      display: 'flex', flexDirection: 'column', gap: '1rem',
      position: 'relative',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {badge > 0 && (
      <span style={{
        position: 'absolute', top: '1rem', right: '1rem',
        background: color, color: '#fff',
        borderRadius: 20, padding: '0.15rem 0.65rem',
        fontSize: '0.75rem', fontWeight: 700,
      }}>
        {badge}
      </span>
    )}

    <div style={{
      width: 52, height: 52, borderRadius: 14,
      background: `${color}22`, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </div>

    <div>
      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
        {title}
      </div>
      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {subtitle}
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color, fontSize: '0.825rem', fontWeight: 600, marginTop: 'auto' }}>
      Open <LuArrowRight size={14} />
    </div>
  </div>
);

const RegistryHome = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/registry/stats'),
      api.get('/registry/overview?year=2025/2026'),
    ])
      .then(([statsRes, overviewRes]) => {
        setStats(statsRes.data);
        setOverview(overviewRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totals = overview?.totals || {};

  const statItems = [
    {
      icon: <LuUsers size={20} />,
      label: 'Total Non-Teaching Staff',
      value: loading ? '…' : (totals.total_staff ?? 0),
      color: '#3b82f6',
    },
    {
      icon: <LuClipboardCheck size={20} />,
      label: 'Submitted This Cycle',
      value: loading ? '…' : (totals.submitted ?? 0),
      color: '#10b981',
    },
    {
      icon: <LuClipboardCheck size={20} />,
      label: 'Pending Validation',
      value: loading ? '…' : (stats?.pending_validation ?? 0),
      color: '#f59e0b',
    },
    {
      icon: <LuAlertCircle size={20} />,
      label: 'Active Invalidations',
      value: loading ? '…' : (stats?.pending_disputes ?? 0),
      color: '#ef4444',
    },
    {
      icon: <LuCheckCircle2 size={20} />,
      label: 'Validated This Cycle',
      value: loading ? '…' : (stats?.validated_this_cycle ?? 0),
      color: '#8b5cf6',
    },
  ];

  const pendingValidation = loading ? 0 : (stats?.pending_validation ?? 0);
  const pendingDisputes   = loading ? 0 : (stats?.pending_disputes ?? 0);

  return (
    <div className="page-container stagger-children">
      <WelcomeBanner
        name={userProfile?.full_name || 'Registry Staff'}
        subtitle="Validate Reporting Officer assessments and resolve non-teaching staff invalidations."
      />

      <div className="stats-grid">
        {statItems.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <HubCard
          title="Staff Overview"
          subtitle="Full breakdown of all non-teaching staff appraisal progress by department, status and scores."
          icon={<LuBarChart2 size={24} />}
          color="#3b82f6"
          badge={0}
          onClick={() => navigate('/registry/overview')}
        />
        <HubCard
          title="Recommendations"
          subtitle="Record the Registry's official summary and recommended action for each assessed non-teaching staff member."
          icon={<LuAward size={24} />}
          color="#10b981"
          badge={0}
          onClick={() => navigate('/registry/recommendations')}
        />
        <HubCard
          title="Pending Validation"
          subtitle="Review and validate Reporting Officer assessments for non-teaching staff before they are made available."
          icon={<LuClipboardCheck size={24} />}
          color="#f59e0b"
          badge={pendingValidation}
          onClick={() => navigate('/registry/pending')}
        />
        <HubCard
          title="Assess Reporting Officers"
          subtitle="Grade Reporting Officers who have submitted their own appraisal forms for the current cycle."
          icon={<LuUserCheck size={24} />}
          color="#8b5cf6"
          badge={0}
          onClick={() => navigate('/registry/assess-ro')}
        />
        <HubCard
          title="Invalidations"
          subtitle="Resolve invalidations raised by non-teaching staff regarding their appraisal assessments."
          icon={<LuAlertCircle size={24} />}
          color="#ef4444"
          badge={pendingDisputes}
          onClick={() => navigate('/registry/disputes')}
        />
      </div>
    </div>
  );
};

export default RegistryHome;
