import { useState, useEffect } from 'react';
import { getAuditLogs } from '../../services/appraisalService';

const ACTION_COLORS = {
  CREATED: '#10b981',
  SUBMITTED: '#3b82f6',
  ASSESSED: '#f59e0b',
  APPROVED: '#10b981',
  FLAGGED: '#f97316',
  DISPUTED: '#ef4444',
  RESOLVED: '#10b981',
  DECISION: '#8b5cf6',
  UPDATED: '#8b5cf6',
  DELETED: '#ef4444',
};

const getActionColor = (action = '') => {
  const key = Object.keys(ACTION_COLORS).find(k => action.toUpperCase().includes(k));
  return ACTION_COLORS[key] || '#6b7280';
};

const formatAction = (action = '') =>
  action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getAuditLogs(200);
        setLogs(data);
      } catch (err) { console.error('Audit logs error:', err); }
      finally { setLoading(false); }
    })();
  }, []);

  const actionTypes = [...new Set(logs.map(l => l.action).filter(Boolean))].sort();

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.user_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.entity_type || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = !filterAction || l.action === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">System activity log — submissions, assessments, approvals, and changes.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Search by action, user ID, or entity type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-input" style={{ minWidth: 200 }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            <option value="">All Actions</option>
            {actionTypes.map(a => <option key={a} value={a}>{formatAction(a)}</option>)}
          </select>
          {(search || filterAction) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterAction(''); }}>Clear</button>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No log entries found</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {search || filterAction ? 'No entries match your filters.' : 'System activity will be logged here as users interact with the platform.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {filtered.map(log => {
              const color = getActionColor(log.action);
              const ts = log.created_at ? new Date(log.created_at) : null;
              return (
                <div key={log.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr 1fr',
                  gap: '1rem', alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${color}`,
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {ts ? ts.toLocaleDateString('en-NG') : '—'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {ts ? ts.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>

                  <div>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.6rem',
                      borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
                      background: `${color}22`, color,
                    }}>
                      {formatAction(log.action || 'unknown')}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem' }}>
                    {log.entity_type && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        {log.entity_type}
                        {log.entity_id && (
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.7rem', marginLeft: '0.4rem' }}>
                            #{log.entity_id.slice(0, 8)}…
                          </span>
                        )}
                      </span>
                    )}
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.1rem', fontFamily: 'monospace' }}>
                      by {log.user_id ? log.user_id.slice(0, 8) + '…' : '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
