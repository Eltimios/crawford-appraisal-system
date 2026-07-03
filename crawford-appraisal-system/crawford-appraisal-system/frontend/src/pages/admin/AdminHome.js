import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats } from '../../services/appraisalService';
import WelcomeBanner from '../../components/ui/WelcomeBanner';
import { LuUsers, LuClipboardList, LuClock, LuBuilding2, LuCalendar, LuFileBarChart, LuScrollText } from 'react-icons/lu';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card-stat animate-fade-in">
    <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const AdminHome = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const firstName = userProfile?.full_name?.split(' ')[0] || 'Admin';

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(err => console.error('Admin stats error:', err))
      .finally(() => setLoadingStats(false));
  }, []);

  const statCards = [
    { icon: <LuUsers size={20} />,        label: 'Total Users',       value: loadingStats ? '…' : (stats?.total_users ?? 0),       color: '#3b82f6' },
    { icon: <LuClipboardList size={20} />, label: 'Active Appraisals', value: loadingStats ? '…' : (stats?.active_appraisals ?? 0), color: '#10b981' },
    { icon: <LuClock size={20} />,         label: 'Pending Actions',   value: loadingStats ? '…' : (stats?.pending_actions ?? 0),   color: '#f59e0b' },
    { icon: <LuBuilding2 size={20} />,     label: 'Departments',       value: loadingStats ? '…' : (stats?.departments ?? 0),       color: '#8b5cf6' },
  ];

  const actionCards = [
    { icon: <LuUsers size={22} />,       title: 'Manage Users', desc: 'Create, update, and deactivate user accounts. Assign roles and departments.', path: '/admin/users', btn: 'Manage Users', primary: true },
    { icon: <LuCalendar size={22} />,    title: 'Deadlines',    desc: 'Set and manage appraisal deadlines for each stage of the process.', path: '/admin/deadlines', btn: 'Set Deadlines' },
    { icon: <LuFileBarChart size={22} />,title: 'Reports',      desc: 'View system-wide appraisal statistics and export data to CSV.', path: '/admin/reports', btn: 'View Reports' },
    { icon: <LuScrollText size={22} />,  title: 'Audit Logs',   desc: 'Track all system activity — submissions, assessments, and changes.', path: '/admin/audit', btn: 'View Logs' },
  ];

  return (
    <div className="page-container stagger-children">
      <WelcomeBanner
        name={userProfile?.full_name || firstName}
        subtitle="Manage users, deadlines, and system settings."
      />

      <div className="stats-grid">
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {actionCards.map((item, i) => (
          <div key={i} className="card animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--role-accent-dim)', color: 'var(--role-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{item.desc}</p>
            <button
              onClick={() => navigate(item.path)}
              className={`btn ${item.primary ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              {item.btn}
            </button>
          </div>
        ))}
      </div>

      <div className="card animate-fade-in" style={{ marginTop: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>System Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Frontend',      status: 'Online',    color: '#10b981' },
            { label: 'Backend API',   status: 'Online',    color: '#10b981' },
            { label: 'Supabase Auth', status: 'Connected', color: '#10b981' },
            { label: 'Supabase DB',   status: 'Connected', color: '#10b981' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)',
              padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.color }}>● {item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
