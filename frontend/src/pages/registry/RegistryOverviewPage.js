import { useState, useEffect } from 'react';
import {
  LuUsers, LuClipboardList, LuClock, LuCheckCircle2,
  LuShieldCheck, LuAlertCircle, LuLoader, LuChevronDown, LuChevronUp,
} from 'react-icons/lu';
import api from '../../services/api';

const STATUS_MAP = {
  draft:                    { label: 'Draft',               color: '#94a3b8' },
  submitted:                { label: 'Submitted',           color: '#f59e0b' },
  reporting_officer_assessed: { label: 'RO Assessed',       color: '#3b82f6' },
  registry_validated:       { label: 'Registry Validated',  color: '#8b5cf6' },
  staff_viewed:             { label: 'Accepted',            color: '#10b981' },
  dispute_raised:           { label: 'Invalidation Raised', color: '#ef4444' },
  disputed:                 { label: 'Invalidation Raised', color: '#ef4444' },
  dean_resolved:            { label: 'Resolved',            color: '#10b981' },
  completed:                { label: 'Completed',           color: '#10b981' },
};

const YEARS = ['2025/2026', '2024/2025', '2023/2024'];

const RegistryOverviewPage = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear]     = useState('2025/2026');
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('all');
  const [categoryTab, setCategoryTab] = useState('all'); // all | senior | junior

  useEffect(() => {
    setLoading(true);
    api.get(`/registry/overview?year=${year}`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year]);

  const allAppraisals  = data?.appraisals  || [];
  const allDepartments = data?.departments || [];

  // Apply category partition first, then status filter
  const categoryAppraisals = categoryTab === 'senior'
    ? allAppraisals.filter(a => a.users?.staff_category === 'senior_nonteaching')
    : categoryTab === 'junior'
    ? allAppraisals.filter(a => a.users?.staff_category === 'junior_nonteaching')
    : allAppraisals;

  const categoryDepartments = categoryTab === 'all' ? allDepartments
    : allDepartments.map(d => {
        const dAppraisals = categoryAppraisals.filter(a => a.users?.department === d.name);
        const dStaff = categoryAppraisals.filter(a => a.users?.department === d.name);
        return {
          ...d,
          staff:     dStaff.length > 0 ? d.staff : 0,
          submitted: dAppraisals.filter(a => a.status !== 'draft').length,
          assessed:  dAppraisals.filter(a => ['reporting_officer_assessed','registry_validated','staff_viewed','dispute_raised','disputed','dean_resolved','completed'].includes(a.status)).length,
          validated: dAppraisals.filter(a => a.registry_validated).length,
          disputed:  dAppraisals.filter(a => ['dispute_raised','disputed'].includes(a.status)).length,
        };
      }).filter(d => d.staff > 0);

  // Recompute totals for selected category
  const totals = categoryTab === 'all' ? (data?.totals || {}) : {
    total_staff: categoryAppraisals.length,
    submitted:   categoryAppraisals.filter(a => a.status !== 'draft').length,
    pending:     Math.max(0, categoryAppraisals.filter(a => a.status === 'draft' || !a.status).length),
    assessed:    categoryAppraisals.filter(a => ['reporting_officer_assessed','registry_validated','staff_viewed','dispute_raised','disputed','dean_resolved','completed'].includes(a.status)).length,
    validated:   categoryAppraisals.filter(a => a.registry_validated).length,
    disputes:    categoryAppraisals.filter(a => ['dispute_raised','disputed'].includes(a.status)).length,
  };

  const departments = categoryDepartments;
  const appraisals  = categoryAppraisals;

  const filtered = filter === 'all' ? appraisals
    : filter === 'pending'    ? appraisals.filter(a => a.status === 'submitted')
    : filter === 'assessed'   ? appraisals.filter(a => ['reporting_officer_assessed','registry_validated'].includes(a.status))
    : filter === 'disputes'   ? appraisals.filter(a => ['dispute_raised','disputed'].includes(a.status))
    : filter === 'complete'   ? appraisals.filter(a => ['staff_viewed','dean_resolved','completed'].includes(a.status))
    : appraisals;

  const stats = [
    { icon: <LuUsers size={20} />,        label: 'Total Non-Teaching Staff', value: loading ? '…' : (totals.total_staff ?? 0),  color: '#3b82f6' },
    { icon: <LuClipboardList size={20} />, label: 'Submitted This Cycle',    value: loading ? '…' : (totals.submitted ?? 0),    color: '#10b981' },
    { icon: <LuClock size={20} />,         label: 'Yet to Submit',           value: loading ? '…' : (totals.pending ?? 0),      color: '#f59e0b' },
    { icon: <LuCheckCircle2 size={20} />,  label: 'RO Assessed',             value: loading ? '…' : (totals.assessed ?? 0),    color: '#8b5cf6' },
    { icon: <LuShieldCheck size={20} />,   label: 'Registry Validated',      value: loading ? '…' : (totals.validated ?? 0),   color: '#06b6d4' },
    { icon: <LuAlertCircle size={20} />,   label: 'Active Invalidations',    value: loading ? '…' : (totals.disputes ?? 0),    color: '#ef4444' },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            Non-Teaching Staff Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Appraisal progress for all junior and senior non-teaching staff.
          </p>
        </div>
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: 140, fontSize: '0.875rem' }}
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all',    label: 'All Non-Teaching' },
          { key: 'senior', label: 'Senior Non-Teaching' },
          { key: 'junior', label: 'Junior Non-Teaching' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setCategoryTab(t.key); setFilter('all'); }}
            style={{
              padding: '0.4rem 1.1rem', borderRadius: 20, fontSize: '0.825rem', fontWeight: 700,
              border: categoryTab === t.key ? '2px solid var(--primary-light)' : '1.5px solid var(--border)',
              background: categoryTab === t.key ? 'rgba(59,130,246,0.12)' : 'var(--bg-card)',
              color: categoryTab === t.key ? 'var(--primary-light)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t.label}
            {!loading && (
              <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', opacity: 0.7 }}>
                ({t.key === 'all' ? allAppraisals.length
                  : t.key === 'senior' ? allAppraisals.filter(a => a.users?.staff_category === 'senior_nonteaching').length
                  : allAppraisals.filter(a => a.users?.staff_category === 'junior_nonteaching').length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="card-stat">
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Department Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Department Breakdown</h3>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <LuLoader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : departments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No department data available.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th style={{ textAlign: 'center' }}>Staff</th>
                  <th style={{ textAlign: 'center' }}>Submitted</th>
                  <th style={{ textAlign: 'center' }}>Yet to Submit</th>
                  <th style={{ textAlign: 'center' }}>Validated</th>
                  <th style={{ textAlign: 'center' }}>Invalidations</th>
                  <th style={{ textAlign: 'center' }}>Completion</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d, i) => {
                  const pct = d.staff > 0 ? Math.round((d.submitted / d.staff) * 100) : 0;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{d.name}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{d.staff}</td>
                      <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{d.submitted}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: d.staff - d.submitted > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: d.staff - d.submitted > 0 ? 600 : 400 }}>
                          {Math.max(0, d.staff - d.submitted)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', color: '#8b5cf6', fontWeight: 600 }}>{d.validated}</td>
                      <td style={{ textAlign: 'center' }}>
                        {d.disputed > 0
                          ? <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>{d.disputed}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                          <div style={{ width: 60, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`, height: '100%', borderRadius: 3,
                              background: pct === 100 ? '#10b981' : pct > 50 ? '#3b82f6' : '#f59e0b',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: 30 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Appraisals */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            All Appraisals
            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              ({filtered.length})
            </span>
          </h3>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all',      label: 'All' },
              { key: 'pending',  label: 'Pending Assessment' },
              { key: 'assessed', label: 'Assessed' },
              { key: 'disputes', label: 'Invalidations' },
              { key: 'complete', label: 'Completed' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.775rem', fontWeight: 600,
                  border: filter === f.key ? '1.5px solid var(--primary-light)' : '1.5px solid var(--border)',
                  background: filter === f.key ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: filter === f.key ? 'var(--primary-light)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <LuLoader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            <LuClipboardList size={36} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>No records</p>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>No appraisals match this filter for {year}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map(a => {
              const staff = a.users;
              const isOpen = expanded === a.id;
              const statusInfo = STATUS_MAP[a.status] || { label: a.status, color: '#94a3b8' };
              const isJunior = staff?.staff_category === 'junior_nonteaching';
              const totalScore = a.hod_grades
                ? Object.values(a.hod_grades).reduce((sum, v) => sum + (Number(v?.score) || 0), 0)
                : null;
              const maxScore = isJunior ? 75 : 100;

              return (
                <div
                  key={a.id}
                  style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}
                >
                  <div
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1.25rem', cursor: 'pointer', background: 'var(--bg-card)' }}
                  >
                    <div className="avatar" style={{ width: 36, height: 36, flexShrink: 0, fontSize: '0.8rem' }}>
                      {(staff?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {staff?.full_name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {staff?.department} · {isJunior ? 'Junior Non-Teaching' : 'Senior Non-Teaching'} · {staff?.staff_id || '—'}
                      </div>
                    </div>
                    {totalScore !== null && (
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {totalScore}/{maxScore}
                      </span>
                    )}
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                      background: `${statusInfo.color}22`, color: statusInfo.color,
                    }}>
                      {statusInfo.label}
                    </span>
                    {isOpen ? <LuChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                             : <LuChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', background: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: a.hod_grades ? '1rem' : 0 }}>
                        {[
                          { label: 'Staff ID',     value: staff?.staff_id || '—' },
                          { label: 'Category',     value: isJunior ? 'Junior Non-Teaching' : 'Senior Non-Teaching' },
                          { label: 'Department',   value: staff?.department || '—' },
                          { label: 'Grade Level', value: staff?.current_rank || '—' },
                          { label: 'Year',         value: a.appraisal_year || '—' },
                          { label: 'Status',       value: statusInfo.label },
                          ...(a.hod_grades?.summaryAssessment     ? [{ label: 'RO Summary',              value: a.hod_grades.summaryAssessment }] : []),
                          ...(a.hod_grades?.recommendedAction    ? [{ label: 'RO Recommended Action',   value: a.hod_grades.recommendedAction }] : []),
                          ...(a.hod_recommendation               ? [{ label: 'RO Written Remarks',      value: a.hod_recommendation }] : []),
                          ...(a.registry_summary                 ? [{ label: 'Registry Summary',        value: a.registry_summary }] : []),
                          ...(a.registry_recommended_action      ? [{ label: 'Registry Recommended Action', value: a.registry_recommended_action }] : []),
                          ...(a.registry_remarks                 ? [{ label: 'Registry Remarks',        value: a.registry_remarks }] : []),
                          ...(a.staff_counter_comment            ? [{ label: 'Invalidation Comment',    value: a.staff_counter_comment }] : []),
                          ...(a.dean_resolution                  ? [{ label: 'Registry Resolution',     value: a.dean_resolution }] : []),
                        ].map((item, idx) => (
                          <div key={idx} style={{ background: 'var(--bg-card)', padding: '0.625rem 0.875rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {a.hod_grades && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                            Assessment Scores
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.4rem' }}>
                            {Object.entries(a.hod_grades).map(([key, val]) => (
                              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {val?.score ?? val?.grade ?? '—'}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/5</span>
                                </span>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Total: {totalScore} / {maxScore}
                          </div>
                        </div>
                      )}
                    </div>
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

export default RegistryOverviewPage;
