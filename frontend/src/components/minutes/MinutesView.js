import { useState, useEffect, useRef } from 'react';
import {
  LuUpload, LuFileText, LuAlertTriangle, LuDownload,
  LuCheckCircle2, LuX, LuEye, LuPrinter, LuClipboardList,
  LuLoader, LuCalendar, LuHash,
} from 'react-icons/lu';
import api from '../../services/api';

const TYPE_LABELS = {
  college_board: 'College Board',
  apc: 'A&PC',
  council: 'Council',
};

const TYPE_COLORS = {
  college_board: '#3b82f6',
  apc: '#f59e0b',
  council: '#8b5cf6',
};

const DECISIONS_BY_TYPE = {
  college_board: ['RECOMMENDED FOR APPROVAL', 'NOT RECOMMENDED', 'DEFERRED'],
  apc: [
    'RECOMMENDED FOR PROMOTION + INCREMENT',
    'RECOMMENDED FOR PROMOTION',
    'RECOMMENDED FOR INCREMENT',
    'NOT ELIGIBLE',
    'DEFERRED',
  ],
  council: ['APPROVED', 'REJECTED', 'DEFERRED'],
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtSize(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
}


function buildPrintRecordHTML(record) {
  const type = record.meeting_type;
  const entries = record.extracted_entries || [];
  const discrepancies = record.discrepancies || [];
  const hasScore = type !== 'council';
  const uploader = record.users?.full_name || 'Unknown';

  const entryRows = entries.length
    ? entries.map(e => `<tr>
        <td>${e.staff_id}</td>
        <td>${e.full_name}</td>
        ${hasScore ? `<td>${e.score !== null && e.score !== undefined ? `${e.score}%` : '—'}</td>` : ''}
        <td>${e.decision}</td>
      </tr>`).join('')
    : `<tr><td colspan="${hasScore ? 4 : 3}" style="text-align:center;color:#999;font-style:italic;">No entries extracted from this PDF.</td></tr>`;

  const discrepancyRows = discrepancies.length
    ? discrepancies.map(d => `<tr>
        <td>${d.staff_id}</td>
        <td>${d.full_name}</td>
        <td style="color:${d.type === 'decision_mismatch' ? '#b45309' : d.type === 'score_mismatch' ? '#dc2626' : '#7c3aed'}">${d.type.replace(/_/g, ' ').toUpperCase()}</td>
        <td>${d.message}</td>
      </tr>`).join('')
    : `<tr><td colspan="4" style="text-align:center;color:#16a34a;font-style:italic;">No discrepancies found — minutes verified.</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
<title>Minutes — ${TYPE_LABELS[type]} Meeting ${record.meeting_number} (${record.appraisal_year})</title>
<style>
  @page { margin: 15mm; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; }
  h1 { text-align: center; font-size: 14pt; margin: 0 0 2px; }
  h2 { text-align: center; font-size: 11pt; margin: 0 0 12px; color: #555; }
  hr { border: none; border-top: 1px solid #999; margin: 10px 0; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 12px; font-size: 9pt; }
  .meta div { padding: 2px 0; border-bottom: 1px solid #eee; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 8px 0; }
  th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border: 1px solid #ddd; }
  .section-title { font-weight: 700; font-size: 10pt; margin: 14px 0 4px; }
  .warn-header { background: #fef3c7; }
</style>
</head>
<body>
<h1>Crawford University</h1>
<h2>${TYPE_LABELS[type]} Meeting Minutes — Record ${record.meeting_number}/${record.appraisal_year}</h2>
<hr>
<div class="meta">
  <div><b>Meeting Type:</b> ${TYPE_LABELS[type]}</div>
  <div><b>Appraisal Year:</b> ${record.appraisal_year}</div>
  <div><b>Meeting Date:</b> ${fmtDate(record.meeting_date)}</div>
  <div><b>Meeting Number:</b> ${record.meeting_number}</div>
  <div><b>Uploaded By:</b> ${uploader}</div>
  <div><b>Upload Date:</b> ${fmtDate(record.created_at)}</div>
  <div><b>File:</b> ${record.pdf_filename}</div>
  <div><b>Entries Found:</b> ${entries.length} | Discrepancies: ${discrepancies.length}</div>
</div>
${record.notes ? `<p style="font-style:italic;color:#555;font-size:9pt;margin:4px 0 8px;">Notes: ${record.notes}</p>` : ''}
<hr>
<div class="section-title">EXTRACTED STAFF ENTRIES (${entries.length})</div>
<table>
  <tr>
    <th>Staff ID</th>
    <th>Full Name</th>
    ${hasScore ? '<th>Score</th>' : ''}
    <th>Decision</th>
  </tr>
  ${entryRows}
</table>
<div class="section-title warn-header" style="padding:4px 8px;border-radius:4px;">
  SYSTEM CROSS-CHECK — DISCREPANCIES (${discrepancies.length})
</div>
<p style="font-size:8pt;color:#555;margin:2px 0 6px;">
  These are warnings only. Council has final say. Discrepancies require investigation before final decision.
</p>
<table>
  <tr>
    <th>Staff ID</th><th>Full Name</th><th>Type</th><th>Details</th>
  </tr>
  ${discrepancyRows}
</table>
<p style="margin-top:16px;font-size:8pt;color:#777;text-align:center;">
  Crawford University WSAMS — Printed: ${new Date().toLocaleString()}. Official document — handle with confidentiality.
</p>
</body>
</html>`;
}

export default function MinutesView({ canUpload, uploadType, viewTypes, pageTitle, pageSubtitle }) {
  const currentYear = new Date().getFullYear();
  const [minutes, setMinutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterYear, setFilterYear] = useState('');
  const [form, setForm] = useState({
    meeting_date: '',
    meeting_number: '',
    appraisal_year: currentYear,
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  const loadMinutes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterYear) params.appraisal_year = filterYear;
      const res = await api.get('/minutes', { params });
      setMinutes(res.data.minutes || []);
    } catch {
      setMinutes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMinutes(); }, [filterYear]); // eslint-disable-line

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setUploadError('Please select a PDF file.'); return; }
    setUploading(true);
    setUploadError('');
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      fd.append('meeting_type', uploadType);
      fd.append('appraisal_year', form.appraisal_year);
      fd.append('meeting_date', form.meeting_date);
      fd.append('meeting_number', form.meeting_number);
      if (form.notes) fd.append('notes', form.notes);

      const res = await api.post('/minutes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadResult(res.data);
      setFile(null);
      setForm({ meeting_date: '', meeting_number: '', appraisal_year: currentYear, notes: '' });
      if (fileRef.current) fileRef.current.value = '';
      loadMinutes();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await api.get(`/minutes/${id}/download-url`);
      if (res.data.url) {
        const a = document.createElement('a');
        a.href = res.data.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }
    } catch {
      alert('Could not generate download link. Please try again.');
    }
  };

  const handlePrint = (record) => {
    const w = window.open('', '_blank');
    w.document.write(buildPrintRecordHTML(record));
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const handleTemplate = async (type) => {
    try {
      const res = await api.get(`/minutes/template/${type}`, { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const names = { college_board: 'CollegeBoard', apc: 'APC', council: 'Council' };
      a.href = url;
      a.download = `Crawford_${names[type] || type}_Minutes_Template.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download template. Please try again.');
    }
  };

  const allTypes = viewTypes || ['college_board', 'apc', 'council'];

  return (
    <div className="page-container stagger-children">
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>
          {pageTitle}
        </h2>
        {pageSubtitle && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.4rem 0 0' }}>
            {pageSubtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: canUpload ? 'minmax(360px, 420px) 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Upload panel ── */}
        {canUpload && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ borderTop: `3px solid ${TYPE_COLORS[uploadType]}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Upload Minutes</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '2px 0 0' }}>
                    {TYPE_LABELS[uploadType]} Meeting · PDF only · Max 20 MB
                  </p>
                </div>
                <span style={{
                  background: `${TYPE_COLORS[uploadType]}22`, color: TYPE_COLORS[uploadType],
                  padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {TYPE_LABELS[uploadType]}
                </span>
              </div>

              <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Meeting Date *
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.meeting_date}
                      onChange={e => setForm(p => ({ ...p, meeting_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Meeting No. *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 1"
                      min="1"
                      value={form.meeting_number}
                      onChange={e => setForm(p => ({ ...p, meeting_number: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Appraisal Year *
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 2025"
                    min="2020"
                    max="2100"
                    value={form.appraisal_year}
                    onChange={e => setForm(p => ({ ...p, appraisal_year: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    PDF File * &nbsp;<span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(PDF only)</span>
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="form-control"
                    onChange={e => setFile(e.target.files[0] || null)}
                    required
                  />
                  {file && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      {file.name} &nbsp;·&nbsp; {fmtSize(file.size)}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Notes (optional)
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Any notes about this meeting..."
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {uploadError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.6rem 0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <LuAlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: '0.825rem', color: '#dc2626' }}>{uploadError}</span>
                  </div>
                )}

                {uploadResult && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#16a34a', fontSize: '0.875rem' }}>
                      <LuCheckCircle2 size={16} /> Uploaded successfully
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {uploadResult.entries_found} entries extracted &nbsp;·&nbsp;
                      {uploadResult.discrepancies_found > 0
                        ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>{uploadResult.discrepancies_found} discrepancies flagged</span>
                        : <span style={{ color: '#16a34a' }}>No discrepancies</span>
                      }
                    </div>
                    {uploadResult.parse_warning && (
                      <div style={{ fontSize: '0.775rem', color: '#92400e', marginTop: 4, fontStyle: 'italic' }}>
                        Warning: {uploadResult.parse_warning}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading}
                  style={{ background: TYPE_COLORS[uploadType], borderColor: TYPE_COLORS[uploadType] }}
                >
                  {uploading ? (
                    <><LuLoader size={15} className="spin" style={{ marginRight: 6 }} /> Uploading & Analysing…</>
                  ) : (
                    <><LuUpload size={15} style={{ marginRight: 6 }} /> Upload Minutes</>
                  )}
                </button>
              </form>
            </div>

            {/* Download template card */}
            <div className="card" style={{ background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <LuClipboardList size={18} color={TYPE_COLORS[uploadType]} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Meeting Template</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                Download the official {TYPE_LABELS[uploadType]} minutes template. Fill it out during the meeting, then upload the completed PDF here.
              </p>
              <button className="btn btn-secondary btn-sm" onClick={() => handleTemplate(uploadType)}>
                <LuDownload size={14} style={{ marginRight: 6 }} /> Download Template (.docx)
              </button>
            </div>
          </div>
        )}

        {/* ── Minutes list ── */}
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="number"
              className="form-control"
              style={{ width: 120 }}
              placeholder="Year"
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              min="2020"
            />
            <button className="btn btn-secondary btn-sm" onClick={loadMinutes}>Refresh</button>

            {/* Template downloads for view-only (council/hr) */}
            {!canUpload && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                {allTypes.map(t => (
                  <button key={t} className="btn btn-secondary btn-sm" onClick={() => handleTemplate(t)}
                    style={{ fontSize: '0.78rem' }}>
                    <LuDownload size={13} style={{ marginRight: 4 }} />{TYPE_LABELS[t]} (.docx)
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <LuLoader size={28} className="spin" /><br />
              <span style={{ marginTop: 8, display: 'block' }}>Loading minutes…</span>
            </div>
          ) : minutes.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem 1.5rem',
              background: 'var(--bg-card)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}>
              <LuFileText size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No minutes uploaded yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)' }}>
                    {allTypes.length > 1 && <th style={thStyle}>Type</th>}
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Mtg #</th>
                    <th style={thStyle}>Year</th>
                    <th style={thStyle}>Entries</th>
                    <th style={thStyle}>Discrepancies</th>
                    <th style={thStyle}>Uploaded By</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {minutes.map(m => {
                    const discCount = (m.discrepancies || []).length;
                    const entryCount = (m.extracted_entries || []).length;
                    const color = TYPE_COLORS[m.meeting_type];
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        {allTypes.length > 1 && (
                          <td style={tdStyle}>
                            <span style={{ background: `${color}22`, color, padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {TYPE_LABELS[m.meeting_type]}
                            </span>
                          </td>
                        )}
                        <td style={tdStyle}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                            <LuCalendar size={13} color="var(--text-muted)" />
                            {fmtDate(m.meeting_date)}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <LuHash size={13} color="var(--text-muted)" />{m.meeting_number}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{m.appraisal_year}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: entryCount > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                            {entryCount}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {discCount > 0
                            ? <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                                {discCount} flagged
                              </span>
                            : <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>Clean</span>
                          }
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {m.users?.full_name || '—'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <button className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.775rem', marginRight: 4 }}
                            onClick={() => setSelected(m)}
                            title="View details"
                          >
                            <LuEye size={13} style={{ marginRight: 4 }} />Details
                          </button>
                          <button className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.775rem', marginRight: 4 }}
                            onClick={() => handleDownload(m.id)}
                            title="Download PDF"
                          >
                            <LuDownload size={13} />
                          </button>
                          <button className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.775rem' }}
                            onClick={() => handlePrint(m)}
                            title="Print record"
                          >
                            <LuPrinter size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Details modal ── */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius)',
            width: '100%', maxWidth: 820, maxHeight: '90vh',
            overflow: 'auto', padding: '1.75rem',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <span style={{
                    background: `${TYPE_COLORS[selected.meeting_type]}22`,
                    color: TYPE_COLORS[selected.meeting_type],
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {TYPE_LABELS[selected.meeting_type]}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                    Meeting #{selected.meeting_number} — {selected.appraisal_year}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {fmtDate(selected.meeting_date)} &nbsp;·&nbsp; Uploaded by {selected.users?.full_name || '—'} on {fmtDate(selected.created_at)}
                  &nbsp;·&nbsp; {selected.pdf_filename}
                  {selected.pdf_size && ` (${fmtSize(selected.pdf_size)})`}
                </div>
                {selected.notes && (
                  <div style={{ marginTop: 4, fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    Notes: {selected.notes}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(selected.id)} title="Download PDF">
                  <LuDownload size={14} style={{ marginRight: 4 }} />PDF
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handlePrint(selected)} title="Print">
                  <LuPrinter size={14} />
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>
                  <LuX size={14} />
                </button>
              </div>
            </div>

            {/* Extracted entries */}
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.6rem', color: 'var(--text-primary)' }}>
              Extracted Staff Entries ({(selected.extracted_entries || []).length})
            </h4>
            {(selected.extracted_entries || []).length > 0 ? (
              <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-hover)' }}>
                      <th style={thStyle}>Staff ID</th>
                      <th style={thStyle}>Full Name</th>
                      {selected.meeting_type !== 'council' && <th style={thStyle}>Score</th>}
                      <th style={thStyle}>Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.extracted_entries || []).map((e, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={tdStyle}>{e.staff_id}</td>
                        <td style={tdStyle}>{e.full_name}</td>
                        {selected.meeting_type !== 'council' && (
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            {e.score !== null && e.score !== undefined ? `${e.score}%` : '—'}
                          </td>
                        )}
                        <td style={tdStyle}>
                          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {e.decision}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.25rem', fontStyle: 'italic' }}>
                No entries could be extracted from this PDF. Ensure the PDF was generated from the official template.
              </div>
            )}

            {/* Discrepancies */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, color: 'var(--text-primary)' }}>
                System Cross-Check
              </h4>
              {(selected.discrepancies || []).length > 0
                ? <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                    {(selected.discrepancies || []).length} discrepancies flagged
                  </span>
                : <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                    Clean — no issues found
                  </span>
              }
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', fontStyle: 'italic' }}>
              These are warnings only. Council retains final authority. Flagged items should be investigated before finalising decisions.
            </p>
            {(selected.discrepancies || []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(selected.discrepancies || []).map((d, i) => (
                  <div key={i} style={{
                    background: d.type === 'score_mismatch' ? '#fef2f2' : d.type === 'decision_mismatch' ? '#fef3c7' : '#faf5ff',
                    border: `1px solid ${d.type === 'score_mismatch' ? '#fecaca' : d.type === 'decision_mismatch' ? '#fde68a' : '#e9d5ff'}`,
                    borderRadius: 8, padding: '0.6rem 0.875rem',
                    display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                  }}>
                    <LuAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1, color: d.type === 'score_mismatch' ? '#dc2626' : d.type === 'decision_mismatch' ? '#d97706' : '#7c3aed' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        {d.staff_id} &mdash; {d.full_name}
                        <span style={{ fontWeight: 400, marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          [{d.type.replace(/_/g, ' ')}]
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        {d.message}
                      </div>
                      {(d.minutes_value || d.db_value) && (
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 3 }}>
                          Minutes: <b>{d.minutes_value}</b> &nbsp;·&nbsp; System: <b>{d.db_value}</b>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <LuCheckCircle2 size={16} color="#16a34a" />
                <span style={{ fontSize: '0.825rem', color: '#15803d', fontWeight: 600 }}>
                  All entries verified — no discrepancies between minutes and system records.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '0.6rem 0.875rem',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: '0.775rem',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  borderBottom: '2px solid var(--border)',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.6rem 0.875rem',
  color: 'var(--text-primary)',
  verticalAlign: 'middle',
};
