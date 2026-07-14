import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuSearch, LuDownload, LuPrinter, LuUserPlus, LuArrowLeft,
  LuUser, LuBuilding2, LuBadge, LuLoader, LuPencil,
} from 'react-icons/lu';
import HROnboardModal from './HROnboardModal';
import HREditStaffModal from './HREditStaffModal';
import api from '../../services/api';

const statusColors = {
  draft: '#6b7280',
  submitted: '#3b82f6',
  hod_assessed: '#f59e0b',
  reporting_officer_assessed: '#f59e0b',
  registry_validated: '#8b5cf6',
  college_board_approved: '#8b5cf6',
  apc_recommended: '#10b981',
  completed: '#10b981',
  dispute_raised: '#ef4444',
  disputed: '#ef4444',
  dean_resolved: '#06b6d4',
};

const statusLabel = (s) =>
  s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Not Submitted';

const HRStaffListPage = ({ title, fetchEndpoint, exportCategory, exportType, backPath }) => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showOnboard, setShowOnboard] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const searchRef = useRef(null);

  const load = (q = '') => {
    setLoading(true);
    api.get(fetchEndpoint, { params: { q: q || undefined } })
      .then(res => setStaff(res.data.staff || []))
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [fetchEndpoint]);

  const handleSearch = (e) => {
    setQuery(e.target.value);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => load(e.target.value), 350);
  };

  const handleExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (exportCategory) params.set('category', exportCategory);
      if (exportType) params.set('type', exportType);

      const response = await api.get(`/hr/export/excel?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Crawford_NominalRoll_${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate Excel export.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async (staffId) => {
    setPrintingId(staffId);
    try {
      const res = await api.get(`/hr/staff/${staffId}/appraisal`);
      const { user, appraisal } = res.data;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(buildPrintHTML(user, appraisal));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 400);
    } catch {
      alert('Failed to load appraisal for printing.');
    } finally {
      setPrintingId(null);
    }
  };

  const latestAppraisal = (s) =>
    (s.appraisals || []).sort((a, b) =>
      (b.appraisal_year || '').localeCompare(a.appraisal_year || '')
    )[0];

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {backPath && (
          <button
            onClick={() => navigate(backPath)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.825rem', padding: 0 }}
          >
            <LuArrowLeft size={15} /> Back
          </button>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem' }}>
            {loading ? 'Loading…' : `${staff.length} staff member${staff.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExcel}
            disabled={exporting}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}
          >
            <LuDownload size={14} />
            {exporting ? 'Exporting…' : 'Nominal Roll (Excel)'}
          </button>
          <button
            onClick={() => setShowOnboard(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}
          >
            <LuUserPlus size={14} /> Onboard Staff
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', maxWidth: 440, marginBottom: '1.25rem' }}>
        <LuSearch size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={handleSearch}
          placeholder="Search by name or staff ID…"
          className="form-input"
          style={{ paddingLeft: '2.375rem' }}
        />
      </div>

      {/* Staff cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuLoader size={22} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : staff.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuUser size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No staff found{query ? ` for "${query}"` : ''}.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {staff.map(s => {
            const latest = latestAppraisal(s);
            const status = latest?.status;
            const color = statusColors[status] || '#6b7280';
            return (
              <div
                key={s.id}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '1.25rem',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div className="avatar" style={{ width: 40, height: 40, flexShrink: 0 }}>
                    {(s.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.full_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      {s.staff_id || 'No Staff ID'}
                    </div>
                  </div>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: 20,
                    fontSize: '0.7rem', fontWeight: 700,
                    background: `${color}22`, color,
                    flexShrink: 0,
                  }}>
                    {statusLabel(status)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  {s.department && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <LuBuilding2 size={12} /> {s.department}
                    </span>
                  )}
                  {s.current_rank && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <LuBadge size={12} /> {s.current_rank}
                    </span>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setEditingStaff(s)}
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <LuPencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handlePrint(s.id)}
                    disabled={printingId === s.id}
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    {printingId === s.id
                      ? <><LuLoader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
                      : <><LuPrinter size={13} /> Print</>
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showOnboard && (
        <HROnboardModal onClose={() => setShowOnboard(false)} onSuccess={() => load(query)} />
      )}
      {editingStaff && (
        <HREditStaffModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSuccess={() => { load(query); setEditingStaff(null); }}
        />
      )}
    </div>
  );
};

// Simple print-friendly HTML template
const buildPrintHTML = (user, appraisal) => `
<!DOCTYPE html>
<html>
<head>
  <title>Appraisal — ${user?.full_name || 'Staff Member'}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 2cm; }
    h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 11px; color: #555; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 11px; }
    th { background: #1f3864; color: #fff; font-weight: bold; }
    .section-title { background: #e8f0fe; font-weight: bold; color: #1f3864; padding: 6px 8px; margin-top: 16px; margin-bottom: 4px; font-size: 11px; border-left: 3px solid #1f3864; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>Crawford University — Staff Appraisal Form</h1>
  <div class="subtitle">Staff Appraisal Management System | ${new Date().getFullYear()}</div>

  <div class="section-title">Staff Information</div>
  <table>
    <tr><th>Full Name</th><td>${user?.full_name || '—'}</td><th>Staff ID</th><td>${user?.staff_id || '—'}</td></tr>
    <tr><th>Department</th><td>${user?.department || '—'}</td><th>College</th><td>${user?.college || '—'}</td></tr>
    <tr><th>Grade / Rank</th><td>${user?.current_rank || '—'}</td><th>Category</th><td>${user?.staff_category?.replace(/_/g, ' ') || '—'}</td></tr>
    <tr><th>Email</th><td colspan="3">${user?.email || '—'}</td></tr>
  </table>

  ${appraisal ? `
  <div class="section-title">Appraisal Details (${appraisal.appraisal_year || '—'})</div>
  <table>
    <tr><th>Status</th><td>${appraisal.status?.replace(/_/g, ' ') || '—'}</td><th>Year</th><td>${appraisal.appraisal_year || '—'}</td></tr>
    <tr><th>HOD Recommendation</th><td colspan="3">${appraisal.hod_recommendation || '—'}</td></tr>
  </table>
  ${appraisal.apc_decision ? `
  <div class="section-title">A&PC Recommendation</div>
  <table>
    <tr><th>Recommendation</th><td>${appraisal.apc_decision.decision || '—'}</td></tr>
    <tr><th>Notes</th><td>${appraisal.apc_decision.notes || '—'}</td></tr>
  </table>` : ''}
  ` : '<p><em>No appraisal submitted for the current cycle.</em></p>'}

  <br /><br />
  <table>
    <tr>
      <th style="width:40%">Signature (Staff)</th>
      <th style="width:30%">Date</th>
      <th style="width:30%">HR Stamp</th>
    </tr>
    <tr><td style="height:40px"></td><td></td><td></td></tr>
  </table>
  <p style="font-size:10px; color:#888; text-align:center; margin-top:24px;">
    Printed by Crawford University HR Personnel — ${new Date().toLocaleDateString('en-GB')}
  </p>
</body>
</html>`;

export default HRStaffListPage;
