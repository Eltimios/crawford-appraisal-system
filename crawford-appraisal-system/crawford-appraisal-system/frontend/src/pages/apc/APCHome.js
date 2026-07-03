import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LuAward, LuUsers, LuCheckCircle2, LuClock, LuArrowRight, LuBookOpen, LuBuilding2, LuScrollText } from 'react-icons/lu';
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
      Review staff <LuArrowRight size={14} />
    </div>
  </div>
);

// Role config — controls what each APC portal type sees and where it navigates
const ROLE_CONFIG = {
  'a&pc': {
    subtitle: 'Review staff appraisals and submit promotion and increment recommendations.',
    hubs: [
      { title: 'Teaching Staff', subtitle: 'Review Academic (Teaching) staff appraisals and submit promotion recommendations.', icon: <LuBookOpen size={24} />, color: '#f59e0b', path: '/apc/teaching' },
      { title: 'Non-Teaching Staff', subtitle: 'Review Junior and Senior Non-Teaching staff records and submit recommendations.', icon: <LuBuilding2 size={24} />, color: '#8b5cf6', path: '/apc/non-teaching' },
      { title: 'Meeting Minutes', subtitle: 'Upload and manage A&PC committee meeting minutes for appraisal cycles.', icon: <LuScrollText size={24} />, color: '#3b82f6', path: '/apc/minutes' },
    ],
    statLabel: (e) => [
      { icon: <LuAward size={20} />, label: 'Teaching Eligible', value: e.filter(a => a.users?.staff_category === 'academic').length, color: '#f59e0b' },
      { icon: <LuUsers size={20} />, label: 'Non-Teaching Eligible', value: e.filter(a => a.users?.staff_category !== 'academic').length, color: '#8b5cf6' },
    ],
  },
  apc_academic: {
    subtitle: 'Review Academic staff appraisals and submit promotion recommendations.',
    hubs: [
      { title: 'Academic Staff', subtitle: 'Review all Academic (Teaching) staff appraisals eligible for promotion or increment.', icon: <LuBookOpen size={24} />, color: '#f59e0b', path: '/apc-academic/teaching' },
      { title: 'Meeting Minutes', subtitle: 'Upload and manage A&PC committee meeting minutes for appraisal cycles.', icon: <LuScrollText size={24} />, color: '#3b82f6', path: '/apc-academic/minutes' },
    ],
    statLabel: (e) => [
      { icon: <LuAward size={20} />, label: 'Academic Staff Eligible', value: e.length, color: '#f59e0b' },
    ],
  },
  apc_junior: {
    subtitle: 'Review Junior Non-Teaching staff appraisals and submit recommendations.',
    hubs: [
      { title: 'Junior Non-Teaching', subtitle: 'Review Junior Non-Teaching staff appraisals eligible for increment or promotion.', icon: <LuUsers size={24} />, color: '#8b5cf6', path: '/apc-junior/junior' },
      { title: 'Meeting Minutes', subtitle: 'Upload and manage A&PC committee meeting minutes for appraisal cycles.', icon: <LuScrollText size={24} />, color: '#3b82f6', path: '/apc-junior/minutes' },
    ],
    statLabel: (e) => [
      { icon: <LuUsers size={20} />, label: 'Junior Non-Teaching Eligible', value: e.length, color: '#8b5cf6' },
    ],
  },
  apc_senior: {
    subtitle: 'Review Senior Non-Teaching staff appraisals and submit recommendations.',
    hubs: [
      { title: 'Senior Non-Teaching', subtitle: 'Review Senior Non-Teaching staff appraisals eligible for increment or promotion.', icon: <LuBuilding2 size={24} />, color: '#3b82f6', path: '/apc-senior/senior' },
      { title: 'Meeting Minutes', subtitle: 'Upload and manage A&PC committee meeting minutes for appraisal cycles.', icon: <LuScrollText size={24} />, color: '#0891b2', path: '/apc-senior/minutes' },
    ],
    statLabel: (e) => [
      { icon: <LuBuilding2 size={20} />, label: 'Senior Non-Teaching Eligible', value: e.length, color: '#3b82f6' },
    ],
  },
};

const APCHome = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [eligible, setEligible] = useState([]);
  const [decided, setDecided] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const role = userProfile?.role || 'a&pc';
  const config = ROLE_CONFIG[role] || ROLE_CONFIG['a&pc'];

  useEffect(() => {
    Promise.all([
      api.get('/promotions/eligible').then(r => r.data.appraisals || []).catch(err => {
        const msg = err.response?.data?.error || err.response?.statusText || err.message || 'Failed to load';
        setFetchError(`${err.response?.status || ''} ${msg}`.trim());
        return [];
      }),
      api.get('/promotions/decisions').then(r => r.data.appraisals || []).catch(() => []),
    ]).then(([e, d]) => {
      setEligible(e);
      setDecided(d);
    }).finally(() => setLoading(false));
  }, []);

  const roleStats = config.statLabel(eligible);
  const stats = [
    ...roleStats.map(s => ({ ...s, value: loading ? '…' : s.value })),
    { icon: <LuCheckCircle2 size={20} />, label: 'Recommendations Made', value: loading ? '…' : decided.length, color: '#10b981' },
    { icon: <LuClock size={20} />, label: 'Total Pending', value: loading ? '…' : eligible.length, color: '#3b82f6' },
  ];

  return (
    <div className="page-container stagger-children">
      <WelcomeBanner
        name={userProfile?.full_name || 'Member'}
        subtitle={config.subtitle}
      />

      <div className="stats-grid">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {fetchError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <span>Could not load eligible staff: {fetchError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {config.hubs.map((hub, i) => (
          <HubCard key={i} {...hub} onClick={() => navigate(hub.path)} />
        ))}
      </div>
    </div>
  );
};

export default APCHome;
