import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LuLayoutDashboard, LuClipboardList, LuBookOpen, LuBarChart2, LuBell,
  LuUsers, LuPencilLine, LuScale, LuBuilding2, LuInbox, LuCheckCircle2,
  LuAward, LuTrendingUp, LuCoins, LuFileBarChart, LuCalendar,
  LuScrollText, LuSettings, LuLogOut, LuUserCheck, LuUser,
  LuClipboardCheck, LuAlertCircle, LuPrinter, LuUserPlus,
  LuBadge, LuChevronDown, LuChevronRight, LuGavel, LuShield,
} from 'react-icons/lu';

const hodNavItems = [
  { label: 'Dashboard',          icon: LuLayoutDashboard, to: '/hod' },
  { label: 'My Appraisal',       icon: LuClipboardList,   to: '/hod/appraisal' },
  { label: 'Assess Staff',       icon: LuPencilLine,      to: '/hod/assess' },
  { label: 'Staff Publications', icon: LuBookOpen,        to: '/hod/publications' },
  { label: 'My Assessment',      icon: LuBarChart2,       to: '/hod/assessment' },
  { label: 'My Biodata',         icon: LuBadge,           children: [
    { label: 'View Profile',     icon: LuUser,     to: '/hod/biodata' },
    { label: 'Download CV',      icon: LuPrinter,  to: '/hod/cv' },
    { label: 'Account Settings', icon: LuSettings, to: '/hod/profile' },
  ]},
  { label: 'Notifications',      icon: LuBell,            to: '/hod/notifications' },
];

const reportingOfficerNavItems = hodNavItems
  .filter(item => item.label !== 'Staff Publications')
  .map(item =>
    item.label === 'Assess Staff'
      ? { ...item, label: 'Assess My Staff' }
      : item
  );

const navConfig = {
  staff: [
    { label: 'Dashboard',         icon: LuLayoutDashboard, to: '/staff' },
    { label: 'My Appraisal',      icon: LuClipboardList,   to: '/staff/appraisal' },
    { label: 'Publications',      icon: LuBookOpen,        to: '/staff/publications' },
    { label: 'My Assessment',     icon: LuBarChart2,       to: '/staff/assessment' },
    { label: 'My Biodata',        icon: LuBadge,           children: [
      { label: 'View Profile',      icon: LuUser,           to: '/staff/biodata' },
      { label: 'Download CV',       icon: LuPrinter,        to: '/staff/cv' },
      { label: 'Account Settings',  icon: LuSettings,       to: '/staff/profile' },
    ]},
    { label: 'Notifications',     icon: LuBell,            to: '/staff/notifications' },
  ],
  hod: hodNavItems,
  hou: hodNavItems,
  reporting_officer: reportingOfficerNavItems,
  dean: [
    { label: 'Dashboard',          icon: LuLayoutDashboard, to: '/dean' },
    { label: 'My Appraisal',       icon: LuClipboardList,   to: '/dean/appraisal' },
    { label: 'My Assessment',      icon: LuBarChart2,       to: '/dean/assessment' },
    { label: 'My Biodata',         icon: LuBadge,           children: [
      { label: 'View Profile',     icon: LuUser,     to: '/dean/biodata' },
      { label: 'Download CV',      icon: LuPrinter,  to: '/dean/cv' },
      { label: 'Account Settings', icon: LuSettings, to: '/dean/profile' },
    ]},
    { label: 'Assess HODs',        icon: LuUserCheck,       to: '/dean/assess' },
    { label: 'Review Queue',       icon: LuInbox,           to: '/dean/review' },
    { label: 'Approved',           icon: LuCheckCircle2,    to: '/dean/approved' },
    { label: 'Disputes',           icon: LuScale,           to: '/dean/disputes' },
    { label: 'Staff Publications', icon: LuBookOpen,        to: '/dean/publications' },
    { label: 'College Overview',   icon: LuBuilding2,       to: '/dean/overview' },
    { label: 'Meeting Minutes',    icon: LuScrollText,      to: '/dean/minutes' },
    { label: 'External Assessors', icon: LuShield,          to: '/dean/assessors' },
    { label: 'Notifications',      icon: LuBell,            to: '/dean/notifications' },
  ],
  vc: [
    { label: 'Dashboard',           icon: LuLayoutDashboard, to: '/vc' },
    { label: 'Assess Deans',        icon: LuUserCheck,       to: '/vc/assess-deans' },
    { label: 'External Assessors',  icon: LuShield,          to: '/vc/assessors' },
    { label: 'University Overview', icon: LuBuilding2,       to: '/vc/overview' },
    { label: 'Notifications',       icon: LuBell,            to: '/vc/notifications' },
    { label: 'Profile',             icon: LuUser,            to: '/vc/profile' },
  ],
  council: [
    { label: 'Dashboard',         icon: LuLayoutDashboard, to: '/council' },
    { label: 'Pending Decisions', icon: LuInbox,           to: '/council/pending' },
    { label: 'Decision Records',  icon: LuCheckCircle2,    to: '/council/decided' },
    { label: 'Meeting Minutes',   icon: LuScrollText,      to: '/council/minutes' },
    { label: 'Notifications',     icon: LuBell,            to: '/council/notifications' },
    { label: 'Profile',           icon: LuUser,            to: '/council/profile' },
  ],
  registry: [
    { label: 'Dashboard',               icon: LuLayoutDashboard, to: '/registry' },
    { label: 'Staff Overview',          icon: LuUsers,           to: '/registry/overview' },
    { label: 'Recommendations',         icon: LuAward,           to: '/registry/recommendations' },
    { label: 'Pending Validation',      icon: LuClipboardCheck,  to: '/registry/pending' },
    { label: 'Assess Reporting Officers', icon: LuUserCheck,     to: '/registry/assess-ro' },
    { label: 'Invalidations',           icon: LuAlertCircle,     to: '/registry/disputes' },
    { label: 'Notifications',           icon: LuBell,            to: '/registry/notifications' },
    { label: 'Profile',                 icon: LuUser,            to: '/registry/profile' },
  ],
  hr_personnel: [
    { label: 'Dashboard',        icon: LuLayoutDashboard, to: '/hr' },
    { label: 'Meeting Minutes',  icon: LuScrollText,      to: '/hr/minutes' },
    { label: 'Notifications',    icon: LuBell,            to: '/hr/notifications' },
    { label: 'Profile',          icon: LuUser,            to: '/hr/profile' },
  ],
  apc_academic: [
    { label: 'Dashboard',          icon: LuLayoutDashboard, to: '/apc-academic' },
    { label: 'Academic Staff',     icon: LuAward,           to: '/apc-academic/teaching' },
    { label: 'Meeting Minutes',    icon: LuScrollText,      to: '/apc-academic/minutes' },
    { label: 'Reports',            icon: LuFileBarChart,    to: '/apc-academic/reports' },
    { label: 'Notifications',      icon: LuBell,            to: '/apc-academic/notifications' },
    { label: 'Profile',            icon: LuUser,            to: '/apc-academic/profile' },
  ],
  apc_junior: [
    { label: 'Dashboard',              icon: LuLayoutDashboard, to: '/apc-junior' },
    { label: 'Junior Non-Teaching',    icon: LuUsers,           to: '/apc-junior/junior' },
    { label: 'Meeting Minutes',        icon: LuScrollText,      to: '/apc-junior/minutes' },
    { label: 'Reports',                icon: LuFileBarChart,    to: '/apc-junior/reports' },
    { label: 'Notifications',          icon: LuBell,            to: '/apc-junior/notifications' },
    { label: 'Profile',                icon: LuUser,            to: '/apc-junior/profile' },
  ],
  apc_senior: [
    { label: 'Dashboard',              icon: LuLayoutDashboard, to: '/apc-senior' },
    { label: 'Senior Non-Teaching',    icon: LuUsers,           to: '/apc-senior/senior' },
    { label: 'Meeting Minutes',        icon: LuScrollText,      to: '/apc-senior/minutes' },
    { label: 'Reports',                icon: LuFileBarChart,    to: '/apc-senior/reports' },
    { label: 'Notifications',          icon: LuBell,            to: '/apc-senior/notifications' },
    { label: 'Profile',                icon: LuUser,            to: '/apc-senior/profile' },
  ],
  admin: [
    { label: 'Dashboard',    icon: LuLayoutDashboard, to: '/admin' },
    { label: 'Manage Users', icon: LuUsers,           to: '/admin/users' },
    { label: 'Deadlines',    icon: LuCalendar,        to: '/admin/deadlines' },
    { label: 'Reports',      icon: LuFileBarChart,    to: '/admin/reports' },
    { label: 'Audit Logs',   icon: LuScrollText,      to: '/admin/audit' },
    { label: 'Settings',     icon: LuSettings,        to: '/admin/settings' },
  ],
};

const roleLabels = {
  staff:            'Staff Member',
  hod:              'HOD',
  hou:              'HOU',
  reporting_officer:'Reporting Officer',
  dean:             'Dean of College',
  vc:               'Vice Chancellor',
  registry:         'Registry',
  hr_personnel:     'HR Personnel',
  apc_academic:     'A&PC — Academic',
  apc_junior:       'A&PC — Junior Non-Teaching',
  apc_senior:       'A&PC — Senior Non-Teaching',
  council:          'University Council',
  admin:            'Administrator',
};

const rootPaths = {
  staff: '/staff', hod: '/hod', hou: '/hod', reporting_officer: '/hod',
  dean: '/dean', vc: '/vc',
  registry: '/registry', hr_personnel: '/hr',
  apc_academic: '/apc-academic', apc_junior: '/apc-junior', apc_senior: '/apc-senior',
  council: '/council',
  admin: '/admin',
};

const Sidebar = ({ isOpen, onClose }) => {
  const { userProfile, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const isAcademic = userProfile?.staff_category === 'academic';
  const navItems = (navConfig[userRole] || []).filter(item =>
    item.label !== 'Publications' || isAcademic
  );
  const roleLabel = roleLabels[userRole] || 'User';
  const rootPath = rootPaths[userRole] || `/${userRole}`;

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); navigate('/login'); }
    catch { setLoggingOut(false); }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img
            src="/crawford-logo.png"
            alt="Crawford University"
            style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--sidebar-text-primary)', lineHeight: 1.2 }}>
              Crawford
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--sidebar-muted)', fontWeight: 500 }}>
              Appraisal System
            </div>
          </div>
        </div>

        {/* User card */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <div className="avatar" style={{ width: 38, height: 38 }}>
            {getInitials(userProfile?.full_name || userProfile?.email)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontWeight: 700, fontSize: '0.875rem', color: 'var(--sidebar-text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {userProfile?.full_name || 'User'}
            </div>
            <div style={{
              fontSize: '0.7rem', fontWeight: 700,
              color: 'var(--role-accent)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {roleLabel}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const isOpen = openDropdown === item.label;
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                    className="nav-item"
                    style={{ width: '100%', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <span className="nav-icon"><Icon size={17} /></span>
                      <span>{item.label}</span>
                    </div>
                    {isOpen ? <LuChevronDown size={14} /> : <LuChevronRight size={14} />}
                  </button>
                  {isOpen && item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                        style={{ paddingLeft: '2.75rem' }}
                      >
                        <span className="nav-icon"><ChildIcon size={15} /></span>
                        <span style={{ fontSize: '0.85rem' }}>{child.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === rootPath}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon"><Icon size={17} /></span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--sidebar-border)' }}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="nav-item"
            style={{ color: '#f87171', width: '100%' }}
          >
            <span className="nav-icon"><LuLogOut size={17} /></span>
            <span>{loggingOut ? 'Logging out…' : 'Logout'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
