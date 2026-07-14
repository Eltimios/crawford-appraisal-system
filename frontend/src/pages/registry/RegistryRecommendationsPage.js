import { useState, useEffect } from 'react';
import { LuLoader, LuCheckCircle2, LuPencilLine, LuChevronDown, LuChevronUp, LuSave } from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SUMMARY_OPTIONS = [
  'Very Effective', 'Effective', 'Fairly Effective', 'Perform Duty Moderately', 'Definitely Ineffective',
];

const RECOMMENDED_ACTIONS = [
  'Confirmation of Appointment', 'Promotion', 'Degrading', 'Conversion', 'Commendation',
  'Annual Increment', 'Annual Increment with Warning', 'Increment to be deferred',
  'Termination of Appointment', 'Retirement',
];

const YEARS = ['2025/2026', '2024/2025', '2023/2024'];

const STATUS_LABEL = {
  reporting_officer_assessed: { label: 'RO Assessed — Awaiting Validation', color: '#f59e0b' },
  registry_validated:         { label: 'Registry Validated',                color: '#8b5cf6' },
  staff_viewed:               { label: 'Accepted by Staff',                  color: '#10b981' },
  dispute_raised:             { label: 'Invalidation Raised',               color: '#ef4444' },
  disputed:                   { label: 'Invalidation Raised',               color: '#ef4444' },
  dean_resolved:              { label: 'Resolved',                          color: '#10b981' },
  completed:                  { label: 'Completed',                         color: '#10b981' },
};

const RegistryRecommendationsPage = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [year, setYear]             = useState('2025/2026');
  const [tab, setTab]               = useState('all');     // all | senior | junior
  const [expanded, setExpanded]     = useState(null);
  const [forms, setForms]           = useState({});
  const [saving, setSaving]         = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/registry/assessed?year=${year}`)
      .then(res => {
        const list = res.data.appraisals || [];
        setAppraisals(list);
        // Pre-fill form state from saved recommendations
        const initial = {};
        list.forEach(a => {
          initial[a.id] = {
            registry_summary:           a.registry_summary           || '',
            registry_recommended_action: a.registry_recommended_action || '',
            registry_remarks:           a.registry_remarks           || '',
          };
        });
        setForms(initial);
      })
      .catch(() => setAppraisals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [year]);

  const setField = (id, field, value) =>
    setForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const handleSave = async (appraisalId) => {
    const form = forms[appraisalId] || {};
    if (!form.registry_summary) {
      toast.error('Please select a Summary of Assessment.');
      return;
    }
    setSaving(appraisalId);
    try {
      await api.put(`/registry/recommend/${appraisalId}`, {
        registry_summary:            form.registry_summary,
        registry_recommended_action: form.registry_recommended_action || '',
        registry_remarks:            form.registry_remarks || '',
      });
      toast.success('Recommendation saved.');
      // Update local state so badge reflects saved
      setAppraisals(prev => prev.map(a =>
        a.id === appraisalId ? {
          ...a,
          registry_summary:            form.registry_summary,
          registry_recommended_action: form.registry_recommended_action,
          registry_remarks:            form.registry_remarks,
        } : a
      ));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save recommendation.');
    } finally {
      setSaving(null);
    }
  };

  // Category filter
  const categoryList = tab === 'senior'
    ? appraisals.filter(a => a.users?.staff_category === 'senior_nonteaching')
    : tab === 'junior'
    ? appraisals.filter(a => a.users?.staff_category === 'junior_nonteaching')
    : appraisals;

  const filtered     = categoryList;
  const pendingCount = categoryList.filter(a => !a.registry_summary).length;
  const doneCount    = categoryList.filter(a => !!a.registry_summary).length;
  const seniorCount  = appraisals.filter(a => a.users?.staff_category === 'senior_nonteaching').length;
  const juniorCount  = appraisals.filter(a => a.users?.staff_category === 'junior_nonteaching').length;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            Registry Recommendations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Review each assessed non-teaching staff and record the Registry's official recommendation.
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

      {/* Progress banner */}
      {!loading && categoryList.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
          padding: '0.875rem 1.25rem', borderRadius: 'var(--radius)',
          background: pendingCount === 0 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${pendingCount === 0 ? '#10b981' : '#f59e0b'}33`,
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {pendingCount === 0
              ? <LuCheckCircle2 size={18} style={{ color: '#10b981' }} />
              : <LuPencilLine size={18} style={{ color: '#f59e0b' }} />}
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {pendingCount === 0
                ? 'All recommendations recorded for this category.'
                : `${pendingCount} staff ${pendingCount === 1 ? 'member' : 'members'} still need a recommendation.`}
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.25rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            <span><strong style={{ color: '#10b981' }}>{doneCount}</strong> completed</span>
            <span><strong style={{ color: '#f59e0b' }}>{pendingCount}</strong> pending</span>
          </div>
        </div>
      )}

      {/* Combined filter tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[
          { category: 'all',    label: 'All Staff',           count: appraisals.length },
          { category: 'senior', label: 'Senior Non-Teaching', count: seniorCount },
          { category: 'junior', label: 'Junior Non-Teaching', count: juniorCount },
        ].map((t, i) => {
          const isActive = tab === t.category;
          return (
            <button
              key={i}
              onClick={() => setTab(t.category)}
              style={{
                padding: '0.55rem 1rem', fontSize: '0.825rem', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
                borderBottom: `2px solid ${isActive ? 'var(--primary-light)' : 'transparent'}`,
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              <span style={{
                marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: 700,
                padding: '0.1rem 0.45rem', borderRadius: 10,
                background: isActive ? 'rgba(59,130,246,0.15)' : 'var(--bg-hover)',
                color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
              }}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuLoader size={22} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuCheckCircle2 size={40} style={{ marginBottom: '0.75rem', opacity: 0.35 }} />
          <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>
            No records found.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(a => {
            const isOpen   = expanded === a.id;
            const staff    = a.users;
            const isSenior = staff?.staff_category === 'senior_nonteaching';
            const form     = forms[a.id] || {};
            const roGrades = a.hod_grades || {};
            const totalScore = Object.values(roGrades).reduce((s, v) => s + (Number(v?.score) || 0), 0);
            const maxScore   = isSenior ? 100 : 75;
            const hasSaved   = !!a.registry_summary;
            const statusInfo = STATUS_LABEL[a.status] || { label: a.status, color: '#94a3b8' };
            const isDirty    = form.registry_summary !== (a.registry_summary || '') ||
                               form.registry_recommended_action !== (a.registry_recommended_action || '') ||
                               form.registry_remarks !== (a.registry_remarks || '');

            return (
              <div key={a.id} style={{
                border: `1px solid ${hasSaved ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', overflow: 'hidden',
              }}>
                {/* Row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer', background: 'var(--bg-card)' }}
                >
                  <div className="avatar" style={{ width: 38, height: 38, flexShrink: 0 }}>
                    {(staff?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {staff?.full_name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {staff?.department} · {isSenior ? 'Senior' : 'Junior'} Non-Teaching · {staff?.staff_id || '—'}
                    </div>
                  </div>

                  {/* Score */}
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {totalScore}/{maxScore}
                  </span>

                  {/* Registry recommendation badge */}
                  {hasSaved ? (
                    <span style={{ padding: '0.2rem 0.65rem', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                      ✓ {a.registry_summary}
                    </span>
                  ) : (
                    <span style={{ padding: '0.2rem 0.65rem', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                      Pending
                    </span>
                  )}

                  {/* Appraisal status */}
                  <span style={{ padding: '0.2rem 0.65rem', background: `${statusInfo.color}18`, color: statusInfo.color, borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>
                    {statusInfo.label}
                  </span>

                  {isOpen ? <LuChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                           : <LuChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem', background: 'var(--bg-secondary)' }}>

                    {/* RO Assessment */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>
                        Reporting Officer's Assessment
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                        {[
                          { label: 'Total Score',        value: `${totalScore} / ${maxScore}` },
                          { label: 'RO Summary',         value: roGrades.summaryAssessment     || '—' },
                          { label: 'RO Recommended',     value: roGrades.recommendedAction     || '—' },
                        ].map((item, i) => (
                          <div key={i} style={{ padding: '0.55rem 0.8rem', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>{item.label}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      {roGrades.recommendation && (
                        <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)', background: 'var(--bg-card)', padding: '0.7rem', borderRadius: 8, borderLeft: '3px solid var(--role-accent)' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>RO Written Remarks</span>
                          {roGrades.recommendation}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '2px dashed var(--border)', margin: '1rem 0' }} />

                    {/* Registry Recommendation Form */}
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.875rem' }}>
                        Registry Recommendation
                        {hasSaved && !isDirty && (
                          <span style={{ marginLeft: '0.6rem', color: '#10b981', fontWeight: 600 }}>— Saved</span>
                        )}
                        {isDirty && (
                          <span style={{ marginLeft: '0.6rem', color: '#f59e0b', fontWeight: 600 }}>— Unsaved changes</span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">
                            Summary of Assessment <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            className="form-input"
                            value={form.registry_summary || ''}
                            onChange={e => setField(a.id, 'registry_summary', e.target.value)}
                            disabled={saving === a.id}
                          >
                            <option value="">— Select —</option>
                            {SUMMARY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Recommended Action</label>
                          <select
                            className="form-input"
                            value={form.registry_recommended_action || ''}
                            onChange={e => setField(a.id, 'registry_recommended_action', e.target.value)}
                            disabled={saving === a.id}
                          >
                            <option value="">— Select —</option>
                            {RECOMMENDED_ACTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Registry Remarks (optional)</label>
                        <textarea
                          rows={3}
                          className="form-input"
                          placeholder="Add any additional remarks or observations…"
                          value={form.registry_remarks || ''}
                          onChange={e => setField(a.id, 'registry_remarks', e.target.value)}
                          disabled={saving === a.id}
                          style={{ resize: 'vertical' }}
                        />
                      </div>

                      <button
                        onClick={() => handleSave(a.id)}
                        disabled={saving === a.id || !form.registry_summary}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {saving === a.id
                          ? <><LuLoader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                          : <><LuSave size={14} /> {hasSaved ? 'Update Recommendation' : 'Save Recommendation'}</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RegistryRecommendationsPage;
