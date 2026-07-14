import { useState, useEffect } from 'react';
import { LuFileText, LuUser, LuGlobe, LuBarChart2 } from 'react-icons/lu';
import axios from 'axios';

const YEAR = '2025/2026';

const TYPE_LABELS = {
  journal_article: 'Journal Article', refereed_book: 'Refereed Book',
  edited_book: 'Edited Book', chapter_in_book: 'Chapter in Book',
  conference_proceedings: 'Conference Proceedings', conference_paper: 'Conference Paper',
  review_editorship: 'Review / Editorship', technical_report: 'Technical Report', monograph: 'Monograph',
};

const getFileType = (fileName = '', fileUrl = '') => {
  const name = (fileName || fileUrl).toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'doc';
  if (name.match(/\.(jpg|jpeg|png)$/)) return 'image';
  return 'other';
};

// ─── Inline Viewer Modal ──────────────────────────────────────────────────────

const ViewerModal = ({ pub, onClose }) => {
  const fileType = getFileType(pub.file_name, pub.file_url);

  const viewerUrl = fileType === 'doc'
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(pub.file_url)}&embedded=true`
    : pub.file_url;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          width: '100%', maxWidth: 960,
          height: '90vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '0.875rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          flexShrink: 0,
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pub.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {pub.users?.full_name} · {TYPE_LABELS[pub.publication_type] || pub.publication_type} · {pub.year_of_publication}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <a
              href={pub.file_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              onClick={e => e.stopPropagation()}
            >
              Open in Tab ↗
            </a>
            <button onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
          </div>
        </div>

        {/* Viewer body */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {fileType === 'image' ? (
            <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              <img src={pub.file_url} alt={pub.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ) : fileType === 'other' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '1rem' }}>
              <LuFileText size={48} style={{ color: 'var(--text-muted)' }} />
              <p>Preview not available for this file type.</p>
              <a href={pub.file_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Download File</a>
            </div>
          ) : (
            <iframe
              src={viewerUrl}
              title={pub.title}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const HODPublicationsPage = () => {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    axios.get('/api/publications/department')
      .then(res => setPublications(res.data.publications || []))
      .catch(err => console.error('HOD publications error:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = publications.filter(p => {
    const matchSearch = !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.journal_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.publication_type === filterType;
    return matchSearch && matchType;
  });

  const staffCounts = publications.reduce((acc, p) => {
    const name = p.users?.full_name || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-container">
      {viewing && <ViewerModal pub={viewing} onClose={() => setViewing(null)} />}

      <div className="page-header animate-fade-in">
        <h1 className="page-title">Staff Publications</h1>
        <p className="page-subtitle">Publications submitted by staff in your department for {YEAR}.</p>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: <LuFileText size={20} />, label: 'Total Publications', value: loading ? '…' : publications.length, color: '#3b82f6' },
          { icon: <LuUser size={20} />, label: 'Staff with Publications', value: loading ? '…' : Object.keys(staffCounts).length, color: '#10b981' },
          { icon: <LuGlobe size={20} />, label: 'International', value: loading ? '…' : publications.filter(p => p.is_international).length, color: '#f59e0b' },
          { icon: <LuBarChart2 size={20} />, label: 'Total Points', value: loading ? '…' : Math.round(publications.reduce((s, p) => s + (p.points_scored || 0), 0) * 10) / 10, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="card-stat animate-fade-in">
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Search by title, author, journal…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-input" style={{ minWidth: 180 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {(search || filterType) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterType(''); }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Publications table */}
      <div className="card animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Publications
            {filtered.length > 0 && (
              <span className="badge badge-primary" style={{ marginLeft: '0.75rem' }}>{filtered.length}</span>
            )}
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">{publications.length === 0 ? 'No publications yet' : 'No results'}</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {publications.length === 0
                ? 'Publications submitted by your department staff will appear here.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Type</th>
                  <th>Year</th>
                  <th>Scope</th>
                  <th>Points</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: 280 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.title}>
                        {p.title}
                      </div>
                      {p.journal_name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{p.journal_name}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {p.users?.full_name || '—'}
                      {p.users?.current_rank && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.users.current_rank}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                        {TYPE_LABELS[p.publication_type] || p.publication_type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.year_of_publication || '—'}</td>
                    <td>
                      {p.is_international
                        ? <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>International</span>
                        : <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Local</span>}
                    </td>
                    <td style={{ fontWeight: 700, color: '#60a5fa' }}>
                      {p.points_scored ? Math.round(p.points_scored * 10) / 10 : '—'}
                    </td>
                    <td>
                      {p.file_url ? (
                        <button
                          onClick={() => setViewing(p)}
                          className="btn btn-primary btn-sm"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          View
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No file</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HODPublicationsPage;
