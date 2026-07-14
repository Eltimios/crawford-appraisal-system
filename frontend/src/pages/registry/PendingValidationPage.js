import { useState, useEffect } from 'react';
import { LuClipboardCheck, LuLoader, LuCheck, LuChevronDown, LuChevronUp } from 'react-icons/lu';
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

const PendingValidationPage = () => {
  const [appraisals, setAppraisals]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(null);
  const [forms, setForms]             = useState({});
  const [validating, setValidating]   = useState(null);
  const [tab, setTab]                 = useState('all'); // all | senior | junior

  const load = () => {
    setLoading(true);
    api.get('/registry/pending-validation')
      .then(res => setAppraisals(res.data.appraisals || []))
      .catch(() => setAppraisals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setField = (id, field, value) =>
    setForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const handleValidate = async (appraisalId) => {
    const form = forms[appraisalId] || {};
    if (!form.registry_summary) {
      toast.error('Please select a Summary of Assessment before validating.');
      return;
    }
    setValidating(appraisalId);
    try {
      await api.post(`/registry/validate/${appraisalId}`, {
        registry_summary: form.registry_summary,
        registry_recommended_action: form.registry_recommended_action || '',
        remarks: form.remarks || '',
      });
      toast.success('Assessment validated and recommendation saved. Staff has been notified.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to validate assessment.');
    } finally {
      setValidating(null);
    }
  };

  const filtered = tab === 'senior'
    ? appraisals.filter(a => a.users?.staff_category === 'senior_nonteaching')
    : tab === 'junior'
    ? appraisals.filter(a => a.users?.staff_category === 'junior_nonteaching')
    : appraisals;

  const seniorCount = appraisals.filter(a => a.users?.staff_category === 'senior_nonteaching').length;
  const juniorCount = appraisals.filter(a => a.users?.staff_category === 'junior_nonteaching').length;

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
          Pending Validation
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
          Review RO assessments, add your Registry recommendation, and validate each non-teaching staff appraisal.
        </p>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all',    label: `All (${appraisals.length})` },
          { key: 'senior', label: `Senior Non-Teaching (${seniorCount})` },
          { key: 'junior', label: `Junior Non-Teaching (${juniorCount})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.35rem 1rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
              border: tab === t.key ? '1.5px solid var(--primary-light)' : '1.5px solid var(--border)',
              background: tab === t.key ? 'rgba(59,130,246,0.1)' : 'transparent',
              color: tab === t.key ? 'var(--primary-light)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuLoader size={22} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <LuClipboardCheck size={40} style={{ marginBottom: '0.75rem', opacity: 0.35 }} />
          <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>All clear</p>
          <p style={{ fontSize: '0.825rem', margin: 0 }}>No assessments are awaiting validation in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map(a => {
            const isOpen = expanded === a.id;
            const staff  = a.users;
            const isSenior = staff?.staff_category === 'senior_nonteaching';
            const roAssessment = a.hod_grades || {};
            const totalScore = Object.values(roAssessment)
              .reduce((sum, v) => sum + (Number(v?.score) || 0), 0);
            const maxScore = isSenior ? 100 : 75;
            const form = forms[a.id] || {};

            return (
              <div key={a.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {/* Header row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
                >
                  <div className="avatar" style={{ width: 38, height: 38, flexShrink: 0 }}>
                    {(staff?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {staff?.full_name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {staff?.department} · {isSenior ? 'Senior Non-Teaching' : 'Junior Non-Teaching'} · {a.appraisal_year || '—'}
                    </div>
                  </div>
                  {roAssessment.totalScore !== undefined || Object.keys(roAssessment).length > 0 ? (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {totalScore}/{maxScore}
                    </span>
                  ) : null}
                  <span style={{
                    padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                    borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {isSenior ? 'Senior' : 'Junior'}
                  </span>
                  {isOpen
                    ? <LuChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    : <LuChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem', background: 'var(--bg-secondary)' }}>

                    {/* RO Assessment Summary */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                        Reporting Officer's Assessment
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
                        {[
                          { label: 'Total Score',        value: `${totalScore} / ${maxScore}` },
                          { label: 'Summary',            value: roAssessment.summaryAssessment || '—' },
                          { label: 'Recommended Action', value: roAssessment.recommendedAction || '—' },
                        ].map((item, i) => (
                          <div key={i} style={{ padding: '0.6rem 0.875rem', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      {roAssessment.recommendation && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 8, borderLeft: '3px solid var(--role-accent)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>RO Written Remarks</span>
                          {roAssessment.recommendation}
                        </div>
                      )}
                    </div>

                    {/* Scores breakdown (collapsible) */}
                    {Object.keys(roAssessment).filter(k => !['summaryAssessment','recommendedAction','recommendation','totalScore'].includes(k)).length > 0 && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                          Criteria Scores
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.35rem' }}>
                          {Object.entries(roAssessment)
                            .filter(([k]) => !['summaryAssessment','recommendedAction','recommendation','totalScore'].includes(k))
                            .map(([key, val]) => (
                              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.7rem', background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.78rem' }}>
                                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {val?.score ?? val?.grade ?? '—'}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/5</span>
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div style={{ borderTop: '2px dashed var(--border)', margin: '1.25rem 0' }} />

                    {/* Registry Recommendation Form */}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>
                        Registry Recommendation
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">
                            Registry Summary of Assessment <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            className="form-input"
                            value={form.registry_summary || ''}
                            onChange={e => setField(a.id, 'registry_summary', e.target.value)}
                            disabled={validating === a.id}
                          >
                            <option value="">— Select —</option>
                            {SUMMARY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Registry Recommended Action</label>
                          <select
                            className="form-input"
                            value={form.registry_recommended_action || ''}
                            onChange={e => setField(a.id, 'registry_recommended_action', e.target.value)}
                            disabled={validating === a.id}
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
                          placeholder="Add any additional remarks or observations from the Registry…"
                          value={form.remarks || ''}
                          onChange={e => setField(a.id, 'remarks', e.target.value)}
                          disabled={validating === a.id}
                          style={{ resize: 'vertical' }}
                        />
                      </div>

                      <button
                        onClick={() => handleValidate(a.id)}
                        disabled={validating === a.id || !form.registry_summary}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {validating === a.id
                          ? <><LuLoader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Validating…</>
                          : <><LuCheck size={14} /> Validate & Submit Recommendation</>
                        }
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

export default PendingValidationPage;
