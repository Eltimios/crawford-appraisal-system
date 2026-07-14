import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../services/appraisalService';

const ROLE_LABELS = {
  staff: 'Staff', hod: 'HOD', hou: 'HOU', dean: 'Dean',
  college_board: 'College Board', 'a&pc': 'A&PC', admin: 'Admin',
};

const CATEGORY_LABELS = {
  academic: 'Academic',
  senior_nonteaching: 'Senior Non-Teaching',
  junior_nonteaching: 'Junior Non-Teaching',
};

const Field = ({ label, value }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </div>
    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
      {value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set</span>}
    </div>
  </div>
);

const ProfilePage = () => {
  const { userProfile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [qualification, setQualification] = useState(userProfile?.highest_qualification || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');

  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) { setSaveErr('Full name is required.'); return; }
    setSaving(true); setSaveErr(''); setSaveMsg('');
    try {
      await updateProfile({ full_name: fullName.trim(), highest_qualification: qualification });
      await refreshProfile();
      setSaveMsg('Profile updated successfully.');
    } catch {
      setSaveErr('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd.length < 8) { setPwdErr('Password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdErr('Passwords do not match.'); return; }
    setPwdSaving(true); setPwdErr(''); setPwdMsg('');
    try {
      await changePassword(newPwd);
      setPwdMsg('Password changed successfully.');
      setNewPwd(''); setConfirmPwd('');
    } catch {
      setPwdErr('Failed to change password. Please try again.');
    } finally {
      setPwdSaving(false);
    }
  };

  const role = userProfile?.role;
  const color = {
    staff: '#3b82f6', hod: '#8b5cf6', hou: '#8b5cf6', dean: '#f59e0b',
    college_board: '#10b981', 'a&pc': '#ef4444', admin: '#ef4444',
  }[role] || '#6b7280';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">View your account details and update your personal information.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>

        {/* Profile info card */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.25rem', flexShrink: 0 }}>
              {getInitials(userProfile?.full_name || userProfile?.email)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {userProfile?.full_name || 'User'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                {userProfile?.email}
              </div>
              <span style={{
                display: 'inline-block', marginTop: '0.375rem', padding: '0.15rem 0.6rem',
                borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                background: `${color}22`, color,
              }}>
                {ROLE_LABELS[role] || role || 'User'}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <Field label="Staff ID" value={userProfile?.staff_id} />
            <Field label="Department" value={userProfile?.department} />
            <Field label="College" value={userProfile?.college} />
            <Field label="Grade Level" value={userProfile?.current_rank} />
            <Field label="Staff Category" value={CATEGORY_LABELS[userProfile?.staff_category] || userProfile?.staff_category} />
            <Field label="Highest Qualification" value={userProfile?.highest_qualification} />
          </div>
        </div>

        {/* Edit form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Edit Details</h3>

            {saveMsg && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <span>{saveMsg}</span>
              </div>
            )}
            {saveErr && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <span>{saveErr}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Highest Qualification</label>
              <input
                className="form-input"
                value={qualification}
                onChange={e => setQualification(e.target.value)}
                placeholder="e.g. Ph.D, M.Sc, B.Sc"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={handleSaveProfile} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Change Password</h3>

            {pwdMsg && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <span>{pwdMsg}</span>
              </div>
            )}
            {pwdErr && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <span>{pwdErr}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={handleChangePassword} disabled={pwdSaving || !newPwd} className="btn btn-secondary">
                {pwdSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
