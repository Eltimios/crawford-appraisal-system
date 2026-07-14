import { useState, useEffect } from 'react';
import { getDeadlines, saveDeadline } from '../../services/appraisalService';
import { LuClipboardList, LuGraduationCap, LuBuilding2, LuAward } from 'react-icons/lu';

const YEAR = '2025/2026';

const DEADLINE_TYPES = [
  { key: 'staff_submission',   label: 'Staff Appraisal Submission', icon: <LuClipboardList size={22} />, desc: 'Deadline for staff to submit their appraisal forms.' },
  { key: 'hod_assessment',     label: 'HOD Assessment',             icon: <LuGraduationCap size={22} />, desc: 'Deadline for HODs to complete staff assessments.' },
  { key: 'college_board_review', label: 'College Board Review',     icon: <LuBuilding2 size={22} />,     desc: 'Deadline for College Board to review academic staff assessments.' },
  { key: 'apc_decisions',      label: 'A&PC Decisions',             icon: <LuAward size={22} />,         desc: 'Deadline for A&PC to record promotion and increment decisions.' },
];

const DeadlinesPage = () => {
  const [deadlines, setDeadlines] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ date: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getDeadlines(YEAR);
        const map = {};
        data.forEach(d => { map[d.type] = d; });
        setDeadlines(map);
      } catch { /* Firebase not configured yet */ }
      finally { setLoading(false); }
    })();
  }, []);

  const openEdit = (type) => {
    const existing = deadlines[type.key];
    setEditing(type);
    setForm({
      date: existing?.date || '',
      description: existing?.description || '',
    });
  };

  const handleSave = async () => {
    if (!form.date) return;
    setSubmitting(true);
    try {
      await saveDeadline(YEAR, editing.key, form.date, form.description);
      setDeadlines(prev => ({ ...prev, [editing.key]: { type: editing.key, ...form } }));
      setSuccess(`Deadline for "${editing.label}" updated.`);
      setEditing(null);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Deadlines</h1>
        <p className="page-subtitle">Set and manage appraisal deadlines for the {YEAR} academic year.</p>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}><span>{success}</span></div>}

      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{editing.icon} {editing.label}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{editing.desc}</p>
            <div className="form-group">
              <label className="form-label">Deadline Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Additional Notes (optional)</label>
              <textarea className="form-input" rows={3} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Any additional instructions for this deadline..." />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setEditing(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={submitting || !form.date} className="btn btn-primary">
                {submitting ? 'Saving...' : 'Save Deadline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {DEADLINE_TYPES.map(type => {
            const deadline = deadlines[type.key];
            const overdue = isOverdue(deadline?.date);
            return (
              <div key={type.key} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--role-accent)', flexShrink: 0 }}>{type.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{type.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{type.desc}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '160px' }}>
                  {deadline?.date ? (
                    <>
                      <div style={{ fontWeight: 700, color: overdue ? '#ef4444' : '#10b981', fontSize: '0.9rem' }}>
                        {formatDate(deadline.date)}
                      </div>
                      {overdue && <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>OVERDUE</div>}
                      {deadline.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{deadline.description}</div>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not set</span>
                  )}
                </div>
                <button onClick={() => openEdit(type)} className="btn btn-secondary btn-sm">
                  {deadline ? 'Edit' : 'Set'} →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeadlinesPage;
