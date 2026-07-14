import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowLeft, LuDownload, LuPrinter, LuFilter,
  LuLoader, LuRefreshCw, LuFileSpreadsheet,
} from 'react-icons/lu';
import api from '../../services/api';

const YEARS = ['2025/2026', '2024/2025', '2023/2024'];

const CATEGORIES = [
  { value: 'all',          label: 'All Staff' },
  { value: 'teaching',     label: 'Academic (Teaching)' },
  { value: 'non-teaching', label: 'Non-Teaching' },
];

const RECOMMENDATIONS = [
  { value: 'all',         label: 'All Recommendations', color: '#6b7280' },
  { value: 'promoted',    label: 'Promotion',           color: '#16a34a' },
  { value: 'increment',   label: 'Increment',           color: '#2563eb' },
  { value: 'both',        label: 'Promotion + Increment', color: '#0891b2' },
  { value: 'deferred',    label: 'Deferred',            color: '#d97706' },
  { value: 'not_eligible',label: 'Not Eligible',        color: '#dc2626' },
];

const REC_COLORS = {
  promoted:    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  increment:   { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  both:        { bg: '#ecfdf5', text: '#0891b2', border: '#a7f3d0' },
  deferred:    { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  not_eligible:{ bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};

const REC_LABELS = {
  promoted:    'Recommend Promotion',
  increment:   'Recommend Increment',
  both:        'Promotion + Increment',
  deferred:    'Deferred',
  not_eligible:'Not Eligible',
};

const CAT_LABELS = {
  academic:           'Academic',
  junior_nonteaching: 'Non-Teaching (Jr)',
  senior_nonteaching: 'Non-Teaching (Sr)',
};

const COUNCIL_COLORS = {
  approved: { bg: '#f0fdf4', text: '#16a34a' },
  rejected: { bg: '#fef2f2', text: '#dc2626' },
  deferred: { bg: '#fffbeb', text: '#d97706' },
  pending:  { bg: '#f3f4f6', text: '#6b7280' },
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const yearsInGrade = (lastPromo) => {
  if (!lastPromo) return '—';
  const yrs = ((new Date() - new Date(lastPromo)) / (1000 * 60 * 60 * 24 * 365.25));
  return `${yrs.toFixed(1)} yrs`;
};

// ─── Badge component ──────────────────────────────────────────────────────────
const Badge = ({ value, map, fallbackLabel }) => {
  const cfg = map[value] || { bg: '#f3f4f6', text: '#6b7280' };
  return (
    <span style={{
      padding: '0.2rem 0.55rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
      background: cfg.bg, color: cfg.text, whiteSpace: 'nowrap',
    }}>
      {fallbackLabel || value}
    </span>
  );
};

// ─── Summary stat card ────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? `${color}18` : 'var(--bg-card)',
      border: `1.5px solid ${active ? color : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '1rem 1.25rem',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.15s',
      minWidth: 120,
    }}
  >
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>{label}</div>
  </button>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const HRRecommendationsPage = () => {
  const navigate = useNavigate();
  const printRef = useRef(null);

  const [year, setYear]           = useState('2025/2026');
  const [category, setCategory]   = useState('all');
  const [recommendation, setRec]  = useState('all');
  const [data, setData]           = useState([]);
  const [counts, setCounts]       = useState({});
  const [loading, setLoading]     = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError]         = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    setError('');
    api.get('/hr/recommendations', { params: { year, recommendation, category } })
      .then(res => {
        setData(res.data.recommendations || []);
        setCounts(res.data.counts || {});
      })
      .catch(() => setError('Failed to load recommendations. Please try again.'))
      .finally(() => setLoading(false));
  }, [year, recommendation, category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ year, recommendation, category });
      const response = await api.get(`/hr/export/recommendations?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Crawford_Recommendations_${year.replace('/', '-')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate Excel report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const catLabel = CATEGORIES.find(c => c.value === category)?.label || 'All Staff';
    const recLabel = RECOMMENDATIONS.find(r => r.value === recommendation)?.label || 'All Recommendations';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(buildPrintHTML(data, year, catLabel, recLabel, counts));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  const totalCount = data.length;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/hr')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.825rem', padding: 0, marginTop: '0.25rem' }}
        >
          <LuArrowLeft size={15} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Appraisal Recommendations Report
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem' }}>
            Staff appraisals with A&amp;PC recommendations. Filter, preview, then export or print.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={fetchData}
            title="Refresh"
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.75rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
          >
            <LuRefreshCw size={14} />
          </button>
          <button
            onClick={handleExcel}
            disabled={exporting || loading || data.length === 0}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}
          >
            <LuFileSpreadsheet size={14} />
            {exporting ? 'Generating…' : 'Export Excel'}
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || data.length === 0}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}
          >
            <LuPrinter size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
          <LuFilter size={15} /> Filters
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Appraisal Year</label>
            <select className="form-input" value={year} onChange={e => setYear(e.target.value)} style={{ fontSize: '0.875rem' }}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Staff Category</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value)} style={{ fontSize: '0.875rem' }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>A&amp;PC Recommendation</label>
            <select className="form-input" value={recommendation} onChange={e => setRec(e.target.value)} style={{ fontSize: '0.875rem' }}>
              {RECOMMENDATIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'stretch' }}>
          <StatCard label="Total in Report" value={totalCount} color="#6b7280" active={false} onClick={() => {}} />
          {RECOMMENDATIONS.filter(r => r.value !== 'all').map(r => (
            <StatCard
              key={r.value}
              label={r.label}
              value={counts[r.value] || 0}
              color={r.color}
              active={recommendation === r.value}
              onClick={() => setRec(recommendation === r.value ? 'all' : r.value)}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
          <span>{error}</span>
          <button onClick={fetchData} style={{ marginLeft: '1rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: 'inherit' }}>Retry</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <LuLoader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : data.length === 0 && !error ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No recommendations found</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            No appraisals match the selected filters for {year}. Try changing the year or recommendation type.
          </p>
        </div>
      ) : (
        <div ref={printRef}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Showing <strong>{data.length}</strong> staff member{data.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              {year} · {CATEGORIES.find(c => c.value === category)?.label} · {RECOMMENDATIONS.find(r => r.value === recommendation)?.label}
            </span>
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ fontSize: '0.82rem', minWidth: 1400 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>S/N</th>
                  <th>Staff ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>College</th>
                  <th>Category</th>
                  <th>Current Rank / Grade</th>
                  <th>First Appointment</th>
                  <th>Last Promotion</th>
                  <th>Yrs in Grade</th>
                  <th>HOD Assessment</th>
                  <th>A&amp;PC Recommendation</th>
                  <th>A&amp;PC Notes</th>
                  <th>Recommended By</th>
                  <th>A&amp;PC Date</th>
                  <th>Council Decision</th>
                  <th>Council Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a, idx) => {
                  const u = a.users || {};
                  const apc = a.apc_decision || {};
                  const council = a.council_decision || {};
                  const recKey = apc.decision || '';
                  const recCfg = REC_COLORS[recKey] || {};
                  const councilKey = council.decision || 'pending';
                  const councilCfg = COUNCIL_COLORS[councilKey] || COUNCIL_COLORS.pending;

                  return (
                    <tr key={a.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg-hover)' }}>
                      <td style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.staff_id || '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{u.full_name || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{u.department || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{u.college || '—'}</td>
                      <td>
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                          {CAT_LABELS[u.staff_category] || u.staff_category || '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={u.current_rank || '—'}>
                        {u.current_rank || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDate(u.date_of_first_appointment)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDate(u.date_of_last_promotion)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center' }}>{yearsInGrade(u.date_of_last_promotion)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.hod_recommendation || '—'}>
                        {a.hod_recommendation || '—'}
                      </td>
                      <td>
                        {recKey ? (
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: recCfg.bg, color: recCfg.text, border: `1px solid ${recCfg.border}`, whiteSpace: 'nowrap' }}>
                            {REC_LABELS[recKey] || recKey}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={apc.notes || '—'}>
                        {apc.notes || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{apc.recommended_by || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{apc.decidedAt ? formatDate(apc.decidedAt) : '—'}</td>
                      <td>
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: councilCfg.bg, color: councilCfg.text, whiteSpace: 'nowrap' }}>
                          {councilKey.charAt(0).toUpperCase() + councilKey.slice(1)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{council.decided_at ? formatDate(council.decided_at) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div style={{ padding: '0.875rem 1rem', background: 'var(--bg-hover)', borderRadius: '0 0 var(--radius) var(--radius)', borderTop: '1px solid var(--border)', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span><strong>Total: {data.length}</strong> staff member{data.length !== 1 ? 's' : ''}</span>
            <span style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {RECOMMENDATIONS.filter(r => r.value !== 'all' && counts[r.value]).map(r => (
                <span key={r.value} style={{ color: r.color, fontWeight: 600 }}>
                  {r.label}: {counts[r.value]}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Print HTML builder ───────────────────────────────────────────────────────
const buildPrintHTML = (data, year, catLabel, recLabel, counts) => {
  const now = new Date();
  const printDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const printTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const recColorMap = {
    promoted:    '#d9ead3',
    increment:   '#d9e8f5',
    both:        '#d0f0e0',
    deferred:    '#fff2cc',
    not_eligible:'#fce5cd',
  };

  const recTextMap = {
    promoted:    '#1a5c2a',
    increment:   '#1a3c5c',
    both:        '#0a4a3a',
    deferred:    '#7c5c00',
    not_eligible:'#7c1a00',
  };

  const apcLabels = {
    promoted:    'Recommend Promotion',
    increment:   'Recommend Increment',
    both:        'Promotion + Increment',
    deferred:    'Deferred',
    not_eligible:'Not Eligible',
  };

  const catLabels = {
    academic:           'Academic (Teaching)',
    junior_nonteaching: 'Non-Teaching (Junior)',
    senior_nonteaching: 'Non-Teaching (Senior)',
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
  const yrsInGrade = (lastPromo) => {
    if (!lastPromo) return '—';
    return ((new Date() - new Date(lastPromo)) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1) + ' yrs';
  };

  const summaryParts = Object.entries({
    promoted: 'Promotion', increment: 'Increment', both: 'Promo + Incr',
    deferred: 'Deferred', not_eligible: 'Not Eligible',
  })
    .filter(([k]) => counts[k])
    .map(([k, label]) => `${label}: <strong>${counts[k]}</strong>`)
    .join(' &nbsp;&nbsp; ');

  const rows = data.map((a, idx) => {
    const u = a.users || {};
    const apc = a.apc_decision || {};
    const council = a.council_decision || {};
    const decKey = apc.decision || '';
    const bg = recColorMap[decKey] || (idx % 2 === 0 ? '#ffffff' : '#f8f9fa');
    const textColor = recTextMap[decKey] || '#000000';

    return `
    <tr style="background:${bg};">
      <td style="text-align:center;color:#666;">${idx + 1}</td>
      <td style="font-family:monospace;font-size:10px;color:#555;">${u.staff_id || '—'}</td>
      <td style="font-weight:bold;">${u.full_name || '—'}</td>
      <td>${u.department || '—'}</td>
      <td style="font-size:10px;">${u.college || '—'}</td>
      <td style="font-size:10px;">${catLabels[u.staff_category] || u.staff_category || '—'}</td>
      <td style="font-size:10px;">${u.current_rank || '—'}</td>
      <td style="font-size:10px;white-space:nowrap;">${fmt(u.date_of_first_appointment)}</td>
      <td style="font-size:10px;white-space:nowrap;">${fmt(u.date_of_last_promotion)}</td>
      <td style="text-align:center;font-size:10px;">${yrsInGrade(u.date_of_last_promotion)}</td>
      <td style="font-size:10px;">${a.hod_recommendation || '—'}</td>
      <td style="font-weight:bold;color:${textColor};">${apcLabels[decKey] || decKey || '—'}</td>
      <td style="font-size:10px;max-width:120px;overflow:hidden;">${apc.notes || '—'}</td>
      <td style="font-size:10px;">${apc.recommended_by || '—'}</td>
      <td style="font-size:10px;white-space:nowrap;">${apc.decidedAt ? fmt(apc.decidedAt) : '—'}</td>
      <td style="font-weight:600;color:${council.decision === 'approved' ? '#1a5c2a' : council.decision === 'rejected' ? '#7c0000' : '#7c5c00'};">${council.decision ? council.decision.charAt(0).toUpperCase() + council.decision.slice(1) : 'Pending'}</td>
      <td style="font-size:10px;white-space:nowrap;">${council.decided_at ? fmt(council.decided_at) : '—'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Recommendations Report — Crawford University</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; }
    @page { size: A3 landscape; margin: 1.2cm 1.5cm; }
    .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #1f3864; padding-bottom: 10px; }
    .header h1 { font-size: 16px; color: #1f3864; letter-spacing: 0.5px; }
    .header h2 { font-size: 13px; color: #333; font-weight: normal; margin-top: 3px; }
    .meta { display: flex; justify-content: space-between; font-size: 10px; color: #555; margin-bottom: 10px; }
    .summary-bar { background: #e8f0fe; border: 1px solid #c6d8fa; border-radius: 4px; padding: 6px 12px; margin-bottom: 10px; font-size: 10.5px; color: #1f3864; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    thead tr { background: #1f3864; color: #fff; }
    th { padding: 5px 6px; text-align: left; font-size: 10px; font-weight: bold; border: 1px solid #2a4a80; }
    td { padding: 4px 6px; border: 1px solid #ddd; vertical-align: top; }
    tfoot tr { background: #e8f0fe; font-weight: bold; }
    tfoot td { padding: 5px 6px; border: 1px solid #ccc; }
    .legend { margin-top: 10px; display: flex; gap: 12px; flex-wrap: wrap; font-size: 9.5px; }
    .legend-item { display: flex; align-items: center; gap: 4px; }
    .legend-swatch { width: 14px; height: 10px; border: 1px solid #aaa; border-radius: 2px; }
    .footer { margin-top: 14px; border-top: 1px solid #ccc; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #888; }
    @media print {
      button { display: none; }
      body { font-size: 10px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CRAWFORD UNIVERSITY, IGBESA</h1>
    <h2>Staff Appraisal Recommendations Report &mdash; ${year}</h2>
  </div>

  <div class="meta">
    <span><strong>Category:</strong> ${catLabel} &nbsp;&nbsp; <strong>Filter:</strong> ${recLabel}</span>
    <span><strong>Printed by:</strong> HR Personnel &nbsp;&nbsp; <strong>Date:</strong> ${printDate} at ${printTime}</span>
  </div>

  <div class="summary-bar">
    <strong>Total: ${data.length} staff member${data.length !== 1 ? 's' : ''}</strong>
    ${summaryParts ? ' &nbsp;&mdash;&nbsp; ' + summaryParts : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:28px;">S/N</th>
        <th style="width:70px;">Staff ID</th>
        <th style="width:130px;">Full Name</th>
        <th style="width:110px;">Department</th>
        <th style="width:100px;">College</th>
        <th style="width:80px;">Category</th>
        <th style="width:120px;">Current Rank / Grade</th>
        <th style="width:65px;">First Appt.</th>
        <th style="width:65px;">Last Promo.</th>
        <th style="width:52px;">Yrs</th>
        <th style="width:90px;">HOD Assessment</th>
        <th style="width:100px;">A&amp;PC Recommendation</th>
        <th style="width:100px;">A&amp;PC Notes</th>
        <th style="width:85px;">Recommended By</th>
        <th style="width:60px;">A&amp;PC Date</th>
        <th style="width:68px;">Council Decision</th>
        <th style="width:60px;">Council Date</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2"></td>
        <td colspan="15"><strong>TOTAL: ${data.length} staff member${data.length !== 1 ? 's' : ''}</strong></td>
      </tr>
    </tfoot>
  </table>

  <div class="legend">
    <strong style="font-size:9.5px;">Colour Key:</strong>
    <div class="legend-item"><div class="legend-swatch" style="background:#d9ead3;"></div> Promotion</div>
    <div class="legend-item"><div class="legend-swatch" style="background:#d9e8f5;"></div> Increment</div>
    <div class="legend-item"><div class="legend-swatch" style="background:#d0f0e0;"></div> Promotion + Increment</div>
    <div class="legend-item"><div class="legend-swatch" style="background:#fff2cc;"></div> Deferred</div>
    <div class="legend-item"><div class="legend-swatch" style="background:#fce5cd;"></div> Not Eligible</div>
  </div>

  <div class="footer">
    <span>Crawford University Staff Appraisal Management System &mdash; Confidential</span>
    <span>Page 1 &mdash; Generated ${printDate}</span>
  </div>
</body>
</html>`;
};

export default HRRecommendationsPage;
