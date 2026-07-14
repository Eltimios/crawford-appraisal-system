import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LuUsers, LuBookOpen, LuBuilding2, LuUserPlus, LuArrowRight,
  LuFileSpreadsheet, LuScrollText,
} from 'react-icons/lu';
import WelcomeBanner from '../../components/ui/WelcomeBanner';
import HROnboardModal from './HROnboardModal';
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

const HubCard = ({ title, subtitle, icon, color, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '2rem 1.75rem',
      cursor: 'pointer', transition: 'all 0.2s ease',
      display: 'flex', flexDirection: 'column', gap: '1rem',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{title}</div>
      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{subtitle}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color, fontSize: '0.825rem', fontWeight: 600 }}>
      Enter portal <LuArrowRight size={14} />
    </div>
  </div>
);

const HRHome = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboard, setShowOnboard] = useState(false);

  const loadStats = () => {
    api.get('/hr/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  const statItems = [
    { icon: <LuBookOpen size={20} />,  label: 'Teaching Staff',     value: loading ? '…' : (stats?.teaching_staff ?? 0),   color: '#3b82f6' },
    { icon: <LuBuilding2 size={20} />, label: 'Non-Teaching Staff', value: loading ? '…' : ((stats?.junior_nonteaching ?? 0) + (stats?.senior_nonteaching ?? 0)), color: '#8b5cf6' },
    { icon: <LuUsers size={20} />,     label: 'Total Staff',        value: loading ? '…' : (stats?.total_staff ?? 0),       color: '#10b981' },
  ];

  return (
    <div className="page-container stagger-children">
      <WelcomeBanner
        name={userProfile?.full_name || 'HR Personnel'}
        subtitle="Manage staff records, print appraisals, and export nominal rolls."
      />

      <div className="stats-grid">
        {statItems.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <HubCard title="Teaching Staff" subtitle="View, search, and print appraisals for Academic (Teaching) staff. Download Nominal Roll." icon={<LuBookOpen size={24} />} color="#3b82f6" onClick={() => navigate('/hr/teaching')} />
        <HubCard title="Non-Teaching Staff" subtitle="Access Junior and Senior Non-Teaching staff records. Print appraisals and export data." icon={<LuBuilding2 size={24} />} color="#8b5cf6" onClick={() => navigate('/hr/non-teaching')} />
        <HubCard title="Recommendations Report" subtitle="Generate and print a full A&PC recommendations report. Filter by promotion, increment, deferral. Export to Excel." icon={<LuFileSpreadsheet size={24} />} color="#0891b2" onClick={() => navigate('/hr/recommendations')} />
        <HubCard title="Meeting Minutes Archive" subtitle="View and print all uploaded meeting minutes from College Board, A&PC, and Council levels. Download official templates." icon={<LuScrollText size={24} />} color="#7c3aed" onClick={() => navigate('/hr/minutes')} />
      </div>

      {showOnboard && <HROnboardModal onClose={() => setShowOnboard(false)} onSuccess={loadStats} />}

      {/* Floating onboard button */}
      <button
        onClick={() => setShowOnboard(true)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          background: 'var(--role-accent)', color: '#fff',
          border: 'none', borderRadius: '50px',
          padding: '0.75rem 1.375rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          zIndex: 50, transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
      >
        <LuUserPlus size={16} /> Onboard New Staff
      </button>
    </div>
  );
};

export default HRHome;
