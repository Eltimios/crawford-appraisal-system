import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { LuX, LuUserCog } from 'react-icons/lu';
import api from '../../services/api';
import { NON_TEACHING_CADRES, CADRE_NAMES, parseCadreGrade, combineCadreGrade } from '../../data/nonTeachingCadres';

const ROLES = [
  { value: 'staff',             label: 'Staff Member' },
  { value: 'hod',               label: 'Head of Department (HOD)' },
  { value: 'hou',               label: 'Head of Unit (HOU)' },
  { value: 'reporting_officer', label: 'Reporting Officer' },
  { value: 'dean',              label: 'Dean of College' },
  { value: 'vc',                label: 'Vice Chancellor' },
  { value: 'registry',          label: 'Registry Staff' },
  { value: 'hr_personnel',      label: 'HR Personnel' },
  { value: 'a&pc',              label: 'A&PC Member' },
];

const STAFF_CATEGORIES = [
  { value: 'academic',           label: 'Academic (Teaching)' },
  { value: 'junior_nonteaching', label: 'Non-Teaching — Junior' },
  { value: 'senior_nonteaching', label: 'Non-Teaching — Senior' },
];

const ACADEMIC_RANKS = [
  'Graduate Assistant', 'Assistant Lecturer', 'Lecturer II', 'Lecturer I',
  'Senior Lecturer', 'Associate Professor', 'Professor',
];

const HREditStaffModal = ({ staff, onClose, onSuccess }) => {
  const _isNT = ['junior_nonteaching', 'senior_nonteaching'].includes(staff.staff_category);
  const { cadre: _parsedCadre, grade: _parsedGrade } = _isNT ? parseCadreGrade(staff.current_rank || '') : { cadre: '', grade: '' };

  const [form, setForm] = useState({
    full_name:               staff.full_name              || '',
    staff_id:                staff.staff_id               || '',
    role:                    staff.role                   || 'staff',
    staff_category:          staff.staff_category         || 'academic',
    department:              staff.department             || '',
    college:                 staff.college                || '',
    current_rank:            _isNT ? (_parsedGrade || '') : (staff.current_rank || ''),
    cadre:                   _parsedCadre || '',
    date_of_first_appointment: staff.date_of_first_appointment?.slice(0, 10) || '',
    date_of_last_promotion:  staff.date_of_last_promotion?.slice(0, 10) || '',
    reporting_officer_id:    staff.reporting_officer_id   || '',
  });
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState('');
  const [reportingOfficers, setReportingOfficers] = useState([]);

  const isNonTeaching = ['junior_nonteaching', 'senior_nonteaching'].includes(form.staff_category);

  useEffect(() => {
    api.get('/hr/reporting-officers')
      .then(res => setReportingOfficers(res.data.reporting_officers || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.staff_id.trim())  errs.staff_id  = 'Staff ID is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError('');
    try {
      const { cadre: _cadre, ...submitData } = form;
      if (isNonTeaching) submitData.current_rank = combineCadreGrade(form.cadre, form.current_rank);
      await api.put(`/hr/staff/${staff.id}`, {
        ...submitData,
        reporting_officer_id: (isNonTeaching && form.reporting_officer_id) ? form.reporting_officer_id : null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to update staff profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem 1rem',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '100%', maxWidth: 580,
        maxHeight: 'calc(100vh - 3rem)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <LuUserCog size={18} style={{ color: 'var(--role-accent)' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Edit Staff Profile
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                {staff.email}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {apiError && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <span>{apiError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input name="full_name" className={`form-input ${errors.full_name ? 'error' : ''}`}
                value={form.full_name} onChange={handleChange} disabled={submitting} />
              {errors.full_name && <p className="form-error">{errors.full_name}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Staff ID *</label>
              <input name="staff_id" className={`form-input ${errors.staff_id ? 'error' : ''}`}
                value={form.staff_id} onChange={handleChange} disabled={submitting} />
              {errors.staff_id && <p className="form-error">{errors.staff_id}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" className="form-input" value={form.role} onChange={handleChange} disabled={submitting}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Staff Category</label>
              <select name="staff_category" className="form-input" value={form.staff_category}
                onChange={e => { handleChange(e); setForm(p => ({ ...p, cadre: '', current_rank: '' })); }}
                disabled={submitting}>
                {STAFF_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input name="department" className="form-input" value={form.department}
                onChange={handleChange} disabled={submitting} />
            </div>

            <div className="form-group">
              <label className="form-label">College</label>
              <input name="college" className="form-input" value={form.college}
                onChange={handleChange} disabled={submitting} />
            </div>

            {form.staff_category === 'academic' ? (
              <div className="form-group">
                <label className="form-label">Academic Rank</label>
                <select name="current_rank" className="form-input" value={form.current_rank}
                  onChange={handleChange} disabled={submitting}>
                  <option value="">— Select Rank —</option>
                  {ACADEMIC_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            ) : isNonTeaching ? (
              <>
                <div className="form-group">
                  <label className="form-label">Cadre</label>
                  <select className="form-input" value={form.cadre}
                    onChange={e => setForm(p => ({ ...p, cadre: e.target.value, current_rank: '' }))}
                    disabled={submitting}>
                    <option value="">— Select Cadre —</option>
                    {CADRE_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Grade Level</label>
                  <select name="current_rank" className="form-input" value={form.current_rank}
                    onChange={handleChange} disabled={submitting || !form.cadre}>
                    <option value="">{form.cadre ? '— Select Grade —' : '— Select Cadre first —'}</option>
                    {(NON_TEACHING_CADRES[form.cadre] || []).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">Current Grade / Rank</label>
                <input name="current_rank" className="form-input" value={form.current_rank}
                  onChange={handleChange} disabled={submitting} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Date of First Appointment</label>
              <input name="date_of_first_appointment" type="date" className="form-input"
                value={form.date_of_first_appointment} onChange={handleChange} disabled={submitting} />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Last Promotion</label>
              <input name="date_of_last_promotion" type="date" className="form-input"
                value={form.date_of_last_promotion} onChange={handleChange} disabled={submitting} />
            </div>

            {isNonTeaching && reportingOfficers.length > 0 && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Reporting Officer</label>
                <select name="reporting_officer_id" className="form-input"
                  value={form.reporting_officer_id} onChange={handleChange} disabled={submitting}>
                  <option value="">— Not assigned —</option>
                  {reportingOfficers.map(ro => (
                    <option key={ro.id} value={ro.id}>
                      {ro.full_name}{ro.department ? ` (${ro.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default HREditStaffModal;
