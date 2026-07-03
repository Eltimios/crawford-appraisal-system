import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  LuX, LuUserPlus, LuUsers, LuDownload, LuUpload,
  LuCheckCircle2, LuAlertTriangle, LuFileSpreadsheet,
} from 'react-icons/lu';
import api from '../../services/api';
import { NON_TEACHING_CADRES, CADRE_NAMES, combineCadreGrade } from '../../data/nonTeachingCadres';

const ROLES = [
  { value: 'staff', label: 'Staff Member' },
  { value: 'hod', label: 'Head of Department (HOD)' },
  { value: 'hou', label: 'Head of Unit (HOU)' },
  { value: 'reporting_officer', label: 'Reporting Officer' },
  { value: 'dean', label: 'Dean of College' },
  { value: 'vc', label: 'Vice Chancellor' },
  { value: 'registry', label: 'Registry Staff' },
  { value: 'hr_personnel', label: 'HR Personnel' },
  { value: 'a&pc', label: 'A&PC Member' },
];

const STAFF_CATEGORIES = [
  { value: 'academic', label: 'Academic (Teaching)' },
  { value: 'junior_nonteaching', label: 'Non-Teaching — Junior' },
  { value: 'senior_nonteaching', label: 'Non-Teaching — Senior' },
];

const ACADEMIC_RANKS = [
  'Graduate Assistant', 'Assistant Lecturer', 'Lecturer II', 'Lecturer I',
  'Senior Lecturer', 'Associate Professor', 'Professor',
];

const COLLEGES = [
  'College of Natural and Applied Sciences (CONAS)',
  'College of Arts and Communication Studies (CACOS)',
  'College of Business & Social Sciences (CBSS)',
  'Postgraduate School',
  'School of Postgraduate & Training Studies (SPTS)',
  'Central Administration',
  'Registry',
  'Bursary',
  'Library',
  'Works & Services',
  'Student Affairs',
  'Medical Centre',
  'ICT Services',
  'Security',
  'NIL',
];

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

const STATUS_OPTIONS = ['Permanent', 'Contract', 'Temporary', 'Sabbatical'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const Field = ({ label, required, error, children, full }) => (
  <div className="form-group" style={full ? { gridColumn: '1 / -1' } : {}}>
    <label className="form-label">{label}{required && ' *'}</label>
    {children}
    {error && <p className="form-error">{error}</p>}
  </div>
);

const Tab = ({ label, icon, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '0.55rem 0', border: 'none', borderRadius: 8,
      cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
      background: active ? 'var(--role-accent)' : 'transparent',
      color: active ? '#fff' : 'var(--text-muted)',
      transition: 'all 0.18s ease',
    }}
  >
    {icon}{label}
  </button>
);

// ── Section divider ───────────────────────────────────────────────────────────
const Section = ({ label }) => (
  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, margin: '0.25rem 0' }}>
    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </div>
);

// ── Bulk result view ──────────────────────────────────────────────────────────
const BulkResult = ({ result, onReset }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.625rem' }}>
      {[
        { label: 'Total Rows', value: result.total,   color: '#64748b' },
        { label: 'Created',    value: result.created, color: '#10b981' },
        { label: 'Skipped',    value: result.skipped, color: '#f59e0b' },
      ].map(s => (
        <div key={s.label} style={{ textAlign: 'center', padding: '0.875rem', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 800, fontSize: '1.6rem', color: s.color }}>{s.value}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>

    {result.created > 0 && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.7rem 1rem', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.83rem', color: '#065f46', fontWeight: 600 }}>
        <LuCheckCircle2 size={15} color="#10b981" />
        {result.created} staff account{result.created !== 1 ? 's' : ''} created successfully.
      </div>
    )}

    {result.errors?.length > 0 && (
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Errors / Skipped ({result.errors.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 180, overflowY: 'auto' }}>
          {result.errors.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '0.5rem 0.75rem', borderRadius: 7, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.14)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <LuAlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div><span style={{ fontWeight: 700, color: 'var(--text-muted)', marginRight: 5 }}>{e.sheet} |</span>{e.reason}</div>
            </div>
          ))}
        </div>
      </div>
    )}

    <button type="button" onClick={onReset} className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.82rem' }}>
      Upload Another File
    </button>
  </div>
);

// ── Main modal ────────────────────────────────────────────────────────────────
const HROnboardModal = ({ onClose, onSuccess }) => {
  const [tab, setTab] = useState('single');

  // ── Single form state ──────────────────────────────────────────────────────
  const emptyForm = {
    full_name: '', staff_id: '', email: '', password: '',
    sex: '', date_of_birth: '', state_of_origin: '', qualification: '',
    salary_grade: '', employment_status: '',
    role: 'staff', staff_category: 'academic',
    department: '', college: '',
    current_rank: '', cadre: '',
    date_of_first_appointment: '', date_of_last_promotion: '', confirmation_date: '',
    reporting_officer_id: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [reportingOfficers, setReportingOfficers] = useState([]);

  // ── Bulk state ─────────────────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/hr/reporting-officers')
      .then(res => setReportingOfficers(res.data.reporting_officers || []))
      .catch(() => {});
  }, []);

  const isNonTeaching = ['junior_nonteaching', 'senior_nonteaching'].includes(form.staff_category);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Required';
    if (!form.staff_id.trim()) errs.staff_id = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Required';
    else if (form.password.length < 8) errs.password = 'Min. 8 characters';
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
      await api.post('/hr/onboard-staff', {
        ...submitData,
        college: (submitData.college === 'NIL' || !submitData.college) ? null : submitData.college,
        reporting_officer_id: (form.role === 'staff' && isNonTeaching && form.reporting_officer_id)
          ? form.reporting_officer_id : null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to onboard staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Bulk helpers ───────────────────────────────────────────────────────────
  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/admin/onboarding-template`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Crawford_Staff_Onboarding_Template_${new Date().getFullYear()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download template. Please try again.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/admin/bulk-onboard`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }
      );
      const json = await res.json();
      if (!res.ok) { alert(json.error || 'Upload failed.'); return; }
      setBulkResult(json);
      onSuccess?.();
    } catch {
      alert('Upload failed. Please check the file and try again.');
    } finally {
      setUploading(false);
    }
  };

  const inp = (name, placeholder, type = 'text', extra = {}) => (
    <input
      name={name} type={type}
      className={`form-input ${errors[name] ? 'error' : ''}`}
      value={form[name]} onChange={handleChange}
      placeholder={placeholder} disabled={submitting}
      {...extra}
    />
  );

  const sel = (name, options, placeholder) => (
    <select name={name} className={`form-input ${errors[name] ? 'error' : ''}`} value={form[name]} onChange={handleChange} disabled={submitting}>
      <option value="">{placeholder}</option>
      {options.map(o => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  );

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem 1rem',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '100%', maxWidth: 600,
        maxHeight: 'calc(100vh - 3rem)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <LuUserPlus size={18} style={{ color: 'var(--role-accent)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Onboard New Staff</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
            <LuX size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ padding: '0.875rem 1.5rem 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
            <Tab label="Single Staff" icon={<LuUserPlus size={13} />} active={tab === 'single'} onClick={() => setTab('single')} />
            <Tab label="Bulk Upload" icon={<LuUsers size={13} />} active={tab === 'bulk'} onClick={() => setTab('bulk')} />
          </div>
        </div>

        {/* ── SINGLE STAFF TAB ── */}
        {tab === 'single' ? (
          <form onSubmit={handleSubmit} noValidate style={{ padding: '1.25rem 1.5rem 1.5rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {apiError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>{apiError}</span></div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>

              <Section label="Identity" />

              <Field label="Full Name" required error={errors.full_name}>
                {inp('full_name', 'Dr. Adebayo John')}
              </Field>
              <Field label="Staff ID" required error={errors.staff_id}>
                {inp('staff_id', 'CU/STF/001')}
              </Field>
              <Field label="Sex">
                {sel('sex', ['Male', 'Female'], '— Select Sex —')}
              </Field>
              <Field label="Date of Birth">
                {inp('date_of_birth', '', 'date')}
              </Field>
              <Field label="State of Origin">
                {sel('state_of_origin', NIGERIAN_STATES, '— Select State —')}
              </Field>
              <Field label="Qualification">
                {inp('qualification', 'e.g. Ph.D, B.Sc, HND')}
              </Field>

              <Section label="Account" />

              <Field label="Email Address" required error={errors.email}>
                {inp('email', 'john@crawford.edu.ng', 'email')}
              </Field>
              <Field label="Password" required error={errors.password}>
                {inp('password', 'Min. 8 characters', 'password')}
              </Field>
              <Field label="Role *">
                <select name="role" className="form-input" value={form.role} onChange={handleChange} disabled={submitting}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Staff Category">
                <select name="staff_category" className="form-input" value={form.staff_category}
                  onChange={e => { handleChange(e); setForm(p => ({ ...p, cadre: '', current_rank: '' })); }}
                  disabled={submitting}>
                  {STAFF_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>

              <Section label="Employment" />

              <Field label="Salary Grade">
                {inp('salary_grade', 'e.g. CONUASS 3')}
              </Field>
              <Field label="Employment Status">
                {sel('employment_status', STATUS_OPTIONS, '— Select Status —')}
              </Field>
              <Field label="Department">
                {inp('department', 'e.g. Computer Science')}
              </Field>
              <Field label="College / Unit">
                <select name="college" className="form-input" value={form.college} onChange={handleChange} disabled={submitting}>
                  <option value="">— Select College / Unit —</option>
                  {COLLEGES.map(c => <option key={c} value={c === 'NIL' ? '' : c}>{c}</option>)}
                </select>
              </Field>

              {/* Rank / Cadre — changes based on category */}
              {form.staff_category === 'academic' ? (
                <Field label="Academic Rank / Designation">
                  <select name="current_rank" className="form-input" value={form.current_rank} onChange={handleChange} disabled={submitting}>
                    <option value="">— Select Rank —</option>
                    {ACADEMIC_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              ) : (
                <>
                  <Field label="Cadre">
                    <select className="form-input" value={form.cadre}
                      onChange={e => setForm(p => ({ ...p, cadre: e.target.value, current_rank: '' }))}
                      disabled={submitting}>
                      <option value="">— Select Cadre —</option>
                      {CADRE_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Grade Level">
                    <select name="current_rank" className="form-input" value={form.current_rank} onChange={handleChange} disabled={submitting || !form.cadre}>
                      <option value="">{form.cadre ? '— Select Grade —' : '— Select Cadre first —'}</option>
                      {(NON_TEACHING_CADRES[form.cadre] || []).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </Field>
                </>
              )}

              <Section label="Dates" />

              <Field label="Date of First Appointment">
                {inp('date_of_first_appointment', '', 'date')}
              </Field>
              <Field label="Date of Last Promotion">
                {inp('date_of_last_promotion', '', 'date')}
              </Field>
              <Field label="Confirmation Date">
                {inp('confirmation_date', '', 'date')}
              </Field>

              {form.role === 'staff' && isNonTeaching && reportingOfficers.length > 0 && (
                <Field label="Assign Reporting Officer" full>
                  <select name="reporting_officer_id" className="form-input"
                    value={form.reporting_officer_id} onChange={handleChange} disabled={submitting}>
                    <option value="">— Not assigned —</option>
                    {reportingOfficers.map(ro => (
                      <option key={ro.id} value={ro.id}>
                        {ro.full_name}{ro.department ? ` (${ro.department})` : ''}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Onboarding…' : 'Onboard Staff'}
              </button>
            </div>
          </form>
        ) : (
          /* ── BULK UPLOAD TAB ── */
          <div style={{ padding: '1.25rem 1.5rem 1.5rem', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!bulkResult ? (
              <>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LuFileSpreadsheet size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>How it works</div>
                    <ol style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.7 }}>
                      <li>Download the Excel template below.</li>
                      <li>Fill in staff details across the 3 sheets — Teaching, Non-Teaching Junior, Non-Teaching Senior.</li>
                      <li>Upload the completed file. Accounts will be created automatically.</li>
                    </ol>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <button onClick={downloadTemplate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: '0.875rem', padding: '0.7rem' }}>
                    <LuDownload size={15} /> Download Excel Template
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: '0.875rem', padding: '0.7rem' }}>
                    <LuUpload size={15} /> {uploading ? 'Uploading & Processing…' : 'Upload Completed Template'}
                  </button>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileUpload} />
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Accepted formats: .xlsx, .xls &nbsp;·&nbsp; Max file size: 10 MB
                </div>
              </>
            ) : (
              <BulkResult result={bulkResult} onReset={() => setBulkResult(null)} />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default HROnboardModal;
