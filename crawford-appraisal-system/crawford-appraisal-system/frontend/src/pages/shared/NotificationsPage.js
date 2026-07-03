import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyNotifications, markNotificationRead } from '../../services/appraisalService';
import { LuCalendar, LuCheckCircle2, LuBuilding2, LuClipboardList, LuScale, LuCheck, LuAward, LuFileText, LuInbox, LuBell } from 'react-icons/lu';

const typeConfig = {
  deadline_reminder:       { icon: <LuCalendar size={18} />,      color: '#f59e0b', label: 'Deadline Reminder' },
  assessment_complete:     { icon: <LuCheckCircle2 size={18} />,  color: '#10b981', label: 'Assessment Complete' },
  hod_assessment_complete: { icon: <LuCheckCircle2 size={18} />,  color: '#10b981', label: 'Assessment Complete' },
  college_board_approved:  { icon: <LuBuilding2 size={18} />,     color: '#10b981', label: 'CB Approved' },
  appraisal_submitted:     { icon: <LuClipboardList size={18} />, color: '#3b82f6', label: 'Appraisal Submitted' },
  dispute_submitted:       { icon: <LuScale size={18} />,         color: '#ef4444', label: 'Invalidation Submitted' },
  dispute_resolved:        { icon: <LuCheck size={18} />,         color: '#10b981', label: 'Invalidation Resolved' },
  promotion_eligible:      { icon: <LuAward size={18} />,         color: '#8b5cf6', label: 'Promotion Eligible' },
  promotion_decision:      { icon: <LuFileText size={18} />,      color: '#3b82f6', label: 'Promotion Decision' },
  review_pending:          { icon: <LuInbox size={18} />,         color: '#f59e0b', label: 'Review Pending' },
  system:                  { icon: <LuBell size={18} />,          color: '#64748b', label: 'System' },
};

const NotificationsPage = () => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!userProfile) return;
    (async () => {
      try {
        const data = await getMyNotifications(userProfile.id);
        setNotifications(data);
      } catch {
        setLoading(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [userProfile]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => markNotificationRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">System alerts and updates for your account.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <span className="badge badge-danger">{unreadCount} unread</span>
            )}
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {['all', 'unread'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`tab ${filter === f ? 'active' : ''}`}>
            {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Notifications about deadlines, assessments, and system updates will appear here.
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((n, i) => {
              const cfg = typeConfig[n.type] || typeConfig.system;
              return (
                <div key={n.id} style={{
                  display: 'flex', gap: '1rem', padding: '1rem',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  background: n.isRead ? 'transparent' : 'rgba(59,130,246,0.04)',
                  transition: 'background 0.2s ease',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: `${cfg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div>
                        <span className="badge" style={{ background: `${cfg.color}22`, color: cfg.color, marginBottom: '0.375rem' }}>
                          {cfg.label}
                        </span>
                        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: n.is_read ? 400 : 600 }}>
                          {n.message}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {formatDate(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button onClick={() => handleMarkRead(n.id)} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                  {!n.is_read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '0.4rem' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
