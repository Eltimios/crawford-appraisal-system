import { useState, useEffect } from 'react';
import { getAllUsers, updateUserProfile, createUserAccount } from '../../services/appraisalService';
import { NON_TEACHING_CADRES, CADRE_NAMES, parseCadreGrade, combineCadreGrade } from '../../data/nonTeachingCadres';

const ROLES = [
  'staff', 'hod', 'hou', 'reporting_officer',
  'dean', 'vc', 'registry', 'hr_personnel', 'a&pc',
  'apc_academic', 'apc_junior', 'apc_senior',
  'council', 'admin',
];

const ROLE_LABELS = {
  staff: 'Staff', hod: 'HOD', hou: 'HOU',
  reporting_officer: 'Reporting Officer',
  dean: 'Dean', vc: 'Vice Chancellor',
  registry: 'Registry', hr_personnel: 'HR Personnel',
  'a&pc': 'A&PC',
  apc_academic: 'A&PC — Academic',
  apc_junior: 'A&PC — Junior Non-Teaching',
  apc_senior: 'A&PC — Senior Non-Teaching',
  council: 'University Council',
  admin: 'Admin',
};

const COLLEGES = [
  'College of Natural Sciences',
  'College of Social and Management Sciences',
  'College of Engineering and Technology',
  'College of Law',
  'College of Humanities',
];

const DEPARTMENTS_BY_COLLEGE = {
  'College of Natural Sciences': [
    'Computer Science, ICT & Cybersecurity',
    'Microbiology',
    'Industrial Chemistry',
    'Geology',
    'Biochemistry',
    'Physics',
  ],
  'College of Social and Management Sciences': [
    'Business Administration',
    'Accounting',
    'Economics',
    'Mass Communication',
    'Sociology',
    'Political Science',
  ],
  'College of Engineering and Technology': [
    'Electrical & Electronics Engineering',
    'Civil Engineering',
    'Mechanical Engineering',
    'Computer Engineering',
  ],
  'College of Law': [
    'Law',
  ],
  'College of Humanities': [
    'English & Literary Studies',
    'History & International Studies',
    'Religious Studies',
    'Philosophy',
  ],
};

const ALL_DEPARTMENTS = Object.values(DEPARTMENTS_BY_COLLEGE).flat();

const ACADEMIC_RANKS = [
  'Graduate Assistant',
  'Assistant Lecturer',
  'Lecturer II',
  'Lecturer I',
  'Senior Lecturer',
  'Associate Professor',
  'Professor',
];

const CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'senior_nonteaching', label: 'Senior Non-Teaching' },
  { value: 'junior_nonteaching', label: 'Junior Non-Teaching' },
];

const roleBadgeClass = (role) => {
  const map = {
    staff: 'badge-info', hod: 'badge-primary', hou: 'badge-primary',
    reporting_officer: 'badge-primary',
    dean: 'badge-warning', vc: 'badge-warning',
    registry: 'badge-success', hr_personnel: 'badge-success',
    'a&pc': 'badge-danger', admin: 'badge-danger',
  };
  return map[role] || 'badge-info';
};

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({});
  const [createForm, setCreateForm] = useState({ email: '', password: '', full_name: '', role: 'staff', staff_id: '', department: '', college: '', current_rank: '', staff_category: '', cadre: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch { /* silent until backend is live */ }
      finally { setLoading(false); }
    })();
  }, []);

  const openEdit = (user) => {
    setEditing(user);
    const isNT = ['junior_nonteaching', 'senior_nonteaching'].includes(user.staff_category);
    const { cadre: parsedCadre, grade: parsedGrade } = isNT ? parseCadreGrade(user.current_rank || '') : { cadre: '', grade: '' };
    setForm({
      full_name: user.full_name || '',
      role: user.role || 'staff',
      staff_category: user.staff_category || '',
      department: user.department || '',
      college: user.college || '',
      current_rank: isNT ? (parsedGrade || '') : (user.current_rank || ''),
      cadre: parsedCadre || '',
      is_active: user.is_active !== false,
    });
    setError('');
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const isNT = ['junior_nonteaching', 'senior_nonteaching'].includes(form.staff_category);
      const { cadre: _cadre, ...payload } = form;
      if (isNT) payload.current_rank = combineCadreGrade(form.cadre, form.current_rank);
      await updateUserProfile(editing.id, payload);
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...payload } : u));
      setSuccess(`Updated ${form.full_name} successfully.`);
      setEditing(null);
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.email.trim() || !createForm.password || !createForm.full_name.trim() || !createForm.role) {
      setError('Email, password, full name, and role are required.');
      return;
    }
    if (createForm.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const isNT = ['junior_nonteaching', 'senior_nonteaching'].includes(createForm.staff_category);
      const { cadre: _cadre, ...payload } = createForm;
      if (isNT) payload.current_rank = combineCadreGrade(createForm.cadre, createForm.current_rank);
      const newUser = await createUserAccount(payload);
      setUsers(prev => [newUser, ...prev]);
      setSuccess(`Account created for ${createForm.full_name}.`);
      setCreating(false);
      setCreateForm({ email: '', password: '', full_name: '', role: 'staff', staff_id: '', department: '', college: '', current_rank: '', staff_category: '', cadre: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = !search
      || (u.full_name || '').toLowerCase().includes(search.toLowerCase())
      || (u.email || '').toLowerCase().includes(search.toLowerCase())
      || (u.staff_id || '').toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  if (editing) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => setEditing(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>← Back</button>
          <h1 className="page-title">Edit User</h1>
          <p className="page-subtitle">{editing.email} · Staff ID: {editing.staff_id}</p>
        </div>

        <div className="card" style={{ maxWidth: '640px' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>{error}</span></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Staff Category</label>
              <select className="form-input" value={form.staff_category}
                onChange={e => setForm(p => ({ ...p, staff_category: e.target.value, cadre: '', current_rank: '' }))}>
                <option value="">— Select —</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">College</label>
              <select className="form-input" value={form.college}
                onChange={e => setForm(p => ({ ...p, college: e.target.value, department: '' }))}>
                <option value="">— Select College —</option>
                {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-input" value={form.department}
                onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                <option value="">— Select Department —</option>
                {(form.college ? (DEPARTMENTS_BY_COLLEGE[form.college] || []) : ALL_DEPARTMENTS)
                  .map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {form.staff_category === 'academic' ? (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Academic Rank</label>
                <select className="form-input" value={form.current_rank}
                  onChange={e => setForm(p => ({ ...p, current_rank: e.target.value }))}>
                  <option value="">— Select Rank —</option>
                  {ACADEMIC_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            ) : ['junior_nonteaching', 'senior_nonteaching'].includes(form.staff_category) ? (
              <>
                <div className="form-group">
                  <label className="form-label">Cadre</label>
                  <select className="form-input" value={form.cadre}
                    onChange={e => setForm(p => ({ ...p, cadre: e.target.value, current_rank: '' }))}>
                    <option value="">— Select Cadre —</option>
                    {CADRE_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Grade Level</label>
                  <select className="form-input" value={form.current_rank}
                    onChange={e => setForm(p => ({ ...p, current_rank: e.target.value }))}>
                    <option value="">— Select Grade —</option>
                    {(NON_TEACHING_CADRES[form.cadre] || []).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </>
            ) : null}
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <input type="checkbox" id="is_active" checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
            <label htmlFor="is_active" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Account Active</label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setEditing(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">View and update user accounts, roles, and department assignments.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(
                  `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/admin/onboarding-template`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) throw new Error('Failed');
                const blob = await res.blob();
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href     = url;
                a.download = `Crawford_Staff_Onboarding_Template_${new Date().getFullYear()}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                alert('Failed to download template. Please try again.');
              }
            }}
            className="btn btn-secondary btn-sm">
            ⬇ Download Onboarding Template
          </button>
          <button onClick={() => { setCreating(true); setError(''); }} className="btn btn-primary btn-sm">
            + Create User
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}><span>{success}</span></div>}

      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Create New User</h3>
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>{error}</span></div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={createForm.full_name} onChange={e => setCreateForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Surname Firstname" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="user@crawford.edu.ng" />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 8 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-input" value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Staff Category</label>
                <select className="form-input" value={createForm.staff_category}
                  onChange={e => setCreateForm(p => ({ ...p, staff_category: e.target.value, cadre: '', current_rank: '' }))}>
                  <option value="">— Select —</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Staff ID</label>
                <input className="form-input" value={createForm.staff_id} onChange={e => setCreateForm(p => ({ ...p, staff_id: e.target.value }))} placeholder="e.g. SS/001" />
              </div>
              <div className="form-group">
                <label className="form-label">College</label>
                <select className="form-input" value={createForm.college} onChange={e => setCreateForm(p => ({ ...p, college: e.target.value, department: '' }))}>
                  <option value="">— Select —</option>
                  {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-input" value={createForm.department} onChange={e => setCreateForm(p => ({ ...p, department: e.target.value }))}>
                  <option value="">— Select —</option>
                  {(createForm.college ? (DEPARTMENTS_BY_COLLEGE[createForm.college] || []) : ALL_DEPARTMENTS)
                    .map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {createForm.staff_category === 'academic' ? (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Academic Rank</label>
                  <select className="form-input" value={createForm.current_rank}
                    onChange={e => setCreateForm(p => ({ ...p, current_rank: e.target.value }))}>
                    <option value="">— Select Rank —</option>
                    {ACADEMIC_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              ) : ['junior_nonteaching', 'senior_nonteaching'].includes(createForm.staff_category) ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Cadre</label>
                    <select className="form-input" value={createForm.cadre}
                      onChange={e => setCreateForm(p => ({ ...p, cadre: e.target.value, current_rank: '' }))}>
                      <option value="">— Select Cadre —</option>
                      {CADRE_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grade Level</label>
                    <select className="form-input" value={createForm.current_rank}
                      onChange={e => setCreateForm(p => ({ ...p, current_rank: e.target.value }))}>
                      <option value="">— Select Grade —</option>
                      {(NON_TEACHING_CADRES[createForm.cadre] || []).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => { setCreating(false); setError(''); }} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={submitting} className="btn btn-primary">
                {submitting ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="form-input" style={{ flex: 1, minWidth: '200px' }}
            placeholder="Search by name, email, or staff ID..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select className="form-input" style={{ width: 'auto' }} value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No users found</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {search || roleFilter !== 'all' ? 'Try adjusting your search filters.' : 'No users have been registered yet.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Name</th><th>Staff ID</th><th>Role</th><th>Department</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.full_name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{u.staff_id || '—'}</td>
                    <td><span className={`badge ${roleBadgeClass(u.role)}`}>{ROLE_LABELS[u.role] || u.role || '—'}</span></td>
                    <td style={{ fontSize: '0.875rem' }}>{u.department || '—'}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: u.is_active !== false ? '#10b981' : '#ef4444' }}>
                        ● {u.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td><button onClick={() => openEdit(u)} className="btn btn-secondary btn-sm">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {filtered.length} user{filtered.length !== 1 ? 's' : ''} shown
        </div>
      </div>
    </div>
  );
};

export default ManageUsersPage;
