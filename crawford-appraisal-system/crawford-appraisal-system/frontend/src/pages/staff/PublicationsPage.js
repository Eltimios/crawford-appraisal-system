import { useState, useEffect } from 'react';
import { LuFileText, LuStar, LuNewspaper, LuBookOpen } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { getMyPublications, addPublication, deletePublication } from '../../services/appraisalService';

const PUB_TYPES = [
  { value: 'journal_article', label: 'Journal Article', sole: 3, co: 2.4 },
  { value: 'refereed_book', label: 'Refereed Book', sole: 4, co: 3.2 },
  { value: 'edited_book', label: 'Edited Book', sole: 3, co: 2.4 },
  { value: 'chapter_in_book', label: 'Chapter in Book', sole: 2, co: 1.6 },
  { value: 'conference_proceedings', label: 'Conference Proceedings', sole: 2, co: 1.6 },
  { value: 'conference_paper', label: 'Conference Paper (Unpublished)', sole: 2, co: 1.6 },
  { value: 'review_editorship', label: 'Review / Editorship of Book', sole: 1, co: 0.8 },
  { value: 'technical_report', label: 'Technical Report', sole: 1, co: 0.8 },
  { value: 'monograph', label: 'Monograph (min. 60 pages)', sole: 2, co: 1.6 },
];

const EMPTY_FORM = {
  title: '',
  publication_type: '',
  authorship_position: 'sole',
  journal_name: '',
  year_of_publication: '',
  isbn_issn: '',
};

const PublicationsPage = () => {
  const { userProfile } = useAuth();
  const isAcademic = userProfile?.staff_category === 'academic';

  const [publications, setPublications] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [viewingPub, setViewingPub] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyPublications();
        // getMyPublications returns the raw publications array from the API
        setPublications(res.publications || res);
        setSummary(res.summary || {});
      } catch { /* ignore until backend is live */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (!isAcademic) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Publications</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">Not available for your staff category</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              The publications module is only available to Academic Staff.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('File size must not exceed 10MB.'); return; }
    setSelectedFile(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.publication_type || !form.authorship_position || !form.year_of_publication) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (selectedFile) fd.append('file', selectedFile);

      const saved = await addPublication(null, fd);
      setPublications(prev => [saved, ...prev]);
      setForm(EMPTY_FORM);
      setSelectedFile(null);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save publication. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this publication?')) return;
    try {
      await deletePublication(id);
      setPublications(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('Failed to delete publication.');
    }
  };

  const selectedType = PUB_TYPES.find(t => t.value === form.publication_type);
  const previewScore = selectedType
    ? (form.authorship_position === 'co_author' ? selectedType.co : selectedType.sole)
    : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Publications</h1>
            <p className="page-subtitle">Upload and manage your research papers, books, and conference proceedings.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">+ Add Publication</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: <LuFileText size={20} />, label: 'Total Publications', value: summary.total_publications ?? publications.length, color: '#3b82f6' },
          { icon: <LuStar size={20} />, label: 'Points Scored', value: (summary.total_scored ?? 0).toFixed(1), color: '#f59e0b' },
          { icon: <LuNewspaper size={20} />, label: 'Journal Articles', value: publications.filter(p => p.publication_type === 'journal_article').length, color: '#8b5cf6' },
          { icon: <LuBookOpen size={20} />, label: 'Books', value: publications.filter(p => ['refereed_book', 'edited_book'].includes(p.publication_type)).length, color: '#10b981' },
        ].map((s, i) => (
          <div key={i} className="card-stat">
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.95rem' }}>Publication Scoring Reference</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Publication Type</th>
                <th>Sole / Lead Author</th>
                <th>Co-Author</th>
              </tr>
            </thead>
            <tbody>
              {PUB_TYPES.map(t => (
                <tr key={t.value}>
                  <td>{t.label}</td>
                  <td style={{ color: '#34d399', fontWeight: 600 }}>{t.sole}</td>
                  <td style={{ color: '#94a3b8' }}>{t.co}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>My Publications</h3>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : publications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No publications uploaded yet</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Click "Add Publication" to upload your first research paper or book.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Year</th>
                  <th>Authorship</th>
                  <th>Points</th>
                  <th>File</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {publications.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 260 }}>{p.title}</td>
                    <td><span className="badge badge-info">{PUB_TYPES.find(t => t.value === p.publication_type)?.label || p.publication_type}</span></td>
                    <td>{p.year_of_publication}</td>
                    <td style={{ textTransform: 'capitalize' }}>{(p.authorship_position || '').replace('_', ' ')}</td>
                    <td><span style={{ fontWeight: 700, color: '#34d399' }}>{(p.points_scored || 0).toFixed(1)}</span></td>
                    <td>
                      {p.file_url
                        ? <button onClick={() => setViewingPub(p)} className="btn btn-secondary btn-sm">View</button>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No file</span>
                      }
                    </td>
                    <td>
                      <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingPub && (
        <div className="modal-overlay" onClick={() => setViewingPub(null)}>
          <div
            className="modal"
            style={{ maxWidth: '90vw', width: 900, height: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {viewingPub.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {viewingPub.year_of_publication} · {viewingPub.journal_name || viewingPub.publisher || ''}
                </p>
              </div>
              <button onClick={() => setViewingPub(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.5rem', flexShrink: 0 }}>×</button>
            </div>
            <iframe
              src={viewingPub.file_url}
              title={viewingPub.title}
              style={{ flex: 1, border: 'none', borderRadius: '0 0 var(--radius) var(--radius)' }}
            />
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Add Publication</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>{error}</span></div>}

              <div className="form-group">
                <label className="form-label">Publication Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="form-input" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Full title of the publication" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="form-group">
                  <label className="form-label">Publication Type <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="form-input" value={form.publication_type}
                    onChange={e => setForm(p => ({ ...p, publication_type: e.target.value }))} required>
                    <option value="">Select type...</option>
                    {PUB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="form-input" type="number" min="1980" max="2030"
                    value={form.year_of_publication}
                    onChange={e => setForm(p => ({ ...p, year_of_publication: e.target.value }))}
                    placeholder="e.g. 2024" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="form-group">
                  <label className="form-label">Authorship Position <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="form-input" value={form.authorship_position}
                    onChange={e => setForm(p => ({ ...p, authorship_position: e.target.value }))}>
                    <option value="sole">Sole Author</option>
                    <option value="lead">Lead Author</option>
                    <option value="co_author">Co-Author</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Journal / Publisher Name</label>
                  <input className="form-input" value={form.journal_name}
                    onChange={e => setForm(p => ({ ...p, journal_name: e.target.value }))}
                    placeholder="Journal or publisher name" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ISBN / ISSN (if applicable)</label>
                <input className="form-input" value={form.isbn_issn}
                  onChange={e => setForm(p => ({ ...p, isbn_issn: e.target.value }))}
                  placeholder="e.g. 978-3-16-148410-0" />
              </div>

              <div className="form-group">
                <label className="form-label">Upload File (PDF / JPG — max 10MB)</label>
                <input type="file" accept=".pdf,.jpeg,.jpg,.png" onChange={handleFileChange}
                  style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }} />
                {selectedFile && <p style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.25rem' }}>{selectedFile.name}</p>}
              </div>

              {previewScore !== null && (
                <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                  <span>⭐</span>
                  <span>Score for this publication: <strong>{previewScore}</strong> points</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : '+ Add Publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicationsPage;
