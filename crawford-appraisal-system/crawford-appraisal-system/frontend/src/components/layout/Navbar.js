import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LuBell, LuSun, LuMoon, LuUser, LuLogOut, LuMenu } from 'react-icons/lu';
import api from '../../services/api';

const pageTitles = {
  staff:            'Staff Portal',
  hod:              'HOD / HOU Portal',
  hou:              'HOD / HOU Portal',
  reporting_officer:'Reporting Officer Portal',
  dean:             "Dean's Portal",
  vc:               "Vice Chancellor's Portal",
  registry:         'Registry Portal',
  hr_personnel:     'HR Personnel Portal',
  'a&pc':           'A&PC Portal',
  council:          'University Council Portal',
  admin:            'Administration Portal',
};

const pathMap = {
  'a&pc': 'apc',
  hou: 'hod',
  reporting_officer: 'hod',
  hr_personnel: 'hr',
};

const Navbar = ({ onMenuToggle }) => {
  const { userProfile, userRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    const fetchCount = () => {
      api.get('/notifications/unread-count')
        .then(res => setUnreadCount(res.data.count || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [userProfile]);

  const rolePath = pathMap[userRole] || userRole;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const iconBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative',
  };

  return (
    <header className="navbar">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="mobile-menu-btn"
        style={{ ...iconBtn, display: 'none', border: 'none', background: 'none' }}
        aria-label="Toggle menu"
      >
        <LuMenu size={20} />
      </button>

      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {pageTitles[userRole] || 'Dashboard'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <LuSun size={16} /> : <LuMoon size={16} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate(`/${rolePath}/notifications`)}
          style={iconBtn}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--role-accent)'; e.currentTarget.style.borderColor = 'var(--role-accent)'; e.currentTarget.style.background = 'var(--role-accent-dim)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
          aria-label="Notifications"
        >
          <LuBell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: '#ef4444', color: '#fff',
              borderRadius: 999, minWidth: 18, height: 18,
              fontSize: '0.65rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', lineHeight: 1,
              border: '2px solid var(--bg-secondary)',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '0.375rem 0.75rem 0.375rem 0.375rem',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            aria-label="User menu"
          >
            <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
              {getInitials(userProfile?.full_name || userProfile?.email)}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {userProfile?.full_name?.split(' ')[0] || 'User'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>▾</span>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '0.5rem',
              minWidth: 210, zIndex: 200,
              boxShadow: 'var(--shadow)',
              animation: 'fadeIn 0.15s ease',
            }}>
              <div style={{
                padding: '0.5rem 0.75rem 0.75rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '0.5rem',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {userProfile?.full_name || 'User'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {userProfile?.email}
                </div>
              </div>

              {[
                {
                  icon: <LuUser size={14} />, label: 'My Profile',
                  onClick: () => { setDropdownOpen(false); navigate(`/${rolePath}/profile`); },
                  color: 'var(--text-secondary)',
                  hoverBg: 'var(--bg-hover)',
                },
                {
                  icon: <LuLogOut size={14} />, label: 'Logout',
                  onClick: async () => { setDropdownOpen(false); await logout(); navigate('/login'); },
                  color: '#f87171',
                  hoverBg: 'rgba(239,68,68,0.08)',
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    width: '100%', padding: '0.5rem 0.75rem',
                    borderRadius: 6, background: 'none', border: 'none',
                    cursor: 'pointer', color: item.color,
                    fontSize: '0.875rem', transition: 'all 0.15s ease', textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = item.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
