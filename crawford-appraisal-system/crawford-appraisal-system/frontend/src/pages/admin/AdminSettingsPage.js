import { useState, useEffect } from 'react';
import { LuPower, LuCalendar, LuSettings } from 'react-icons/lu';
import api from '../../services/api';

const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    cycle_open: false,
    current_appraisal_year: '2025/2026',
    allowLateSubmissions: false,
    requirePublications: true,
    enableNotifications: true,
    disputeWindowDays: '14',
  });

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        const s = res.data.settings || {};
        setSettings(prev => ({
          ...prev,
          cycle_open: s.cycle_open === 'true',
          current_appraisal_year: s.current_appraisal_year || prev.current_appraisal_year,
          allowLateSubmissions: s.allowLateSubmissions === 'true',
          requirePublications: s.requirePublications !== 'false',
          enableNotifications: s.enableNotifications !== 'false',
          disputeWindowDays: s.disputeWindowDays || prev.disputeWindowDays,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put('/settings', {
        cycle_open: String(settings.cycle_open),
        current_appraisal_year: settings.current_appraisal_year,
        allowLateSubmissions: String(settings.allowLateSubmissions),
        requirePublications: String(settings.requirePublications),
        enableNotifications: String(settings.enableNotifications),
        disputeWindowDays: settings.disputeWindowDays,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  const ToggleRow = ({ label, desc, settingKey, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => toggle(settingKey)}
        style={{
          width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: settings[settingKey] ? (color || '#10b981') : 'var(--border)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '3px',
          left: settings[settingKey] ? '23px' : '3px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading settings…</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure system-wide appraisal parameters and preferences.</p>
      </div>

      {saved && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}><span>Settings saved successfully.</span></div>}
      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}><span>{error}</span></div>}

      <form onSubmit={handleSave}>
        {/* Cycle Control — most prominent */}
        <div className="card" style={{ marginBottom: '1.5rem', border: settings.cycle_open ? '1.5px solid #10b981' : '1.5px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <LuPower size={20} style={{ color: settings.cycle_open ? '#10b981' : '#f59e0b' }} />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Appraisal Cycle Control</h3>
            <span style={{
              marginLeft: 'auto', padding: '0.2rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
              background: settings.cycle_open ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
              color: settings.cycle_open ? '#10b981' : '#f59e0b',
            }}>
              {settings.cycle_open ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            When <strong>closed</strong>, staff cannot start or submit appraisal forms. Open the cycle at the start of each appraisal period.
          </p>
          <ToggleRow
            settingKey="cycle_open"
            label={settings.cycle_open ? 'Cycle is Open — staff can submit appraisals' : 'Cycle is Closed — staff cannot submit appraisals'}
            desc={settings.cycle_open
              ? 'Toggle off to close the cycle and prevent new submissions.'
              : 'Toggle on to open the cycle and allow staff to submit their appraisal forms.'}
            color="#10b981"
          />
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <LuCalendar size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>General</h3>
          </div>
          <div className="form-group">
            <label className="form-label">Current Appraisal Year</label>
            <input className="form-input" value={settings.current_appraisal_year}
              onChange={e => setSettings(p => ({ ...p, current_appraisal_year: e.target.value }))}
              placeholder="e.g. 2025/2026" style={{ maxWidth: '200px' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              This year label appears on all appraisal forms and records.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Invalidation Window (days)</label>
            <input className="form-input" type="number" min="1" max="60" value={settings.disputeWindowDays}
              onChange={e => setSettings(p => ({ ...p, disputeWindowDays: e.target.value }))}
              style={{ maxWidth: '120px' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Number of days staff have to invalidate an assessment after it is released.
            </p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <LuSettings size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Features</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Toggle system features on or off.</p>
          <ToggleRow settingKey="allowLateSubmissions" label="Allow Late Submissions"
            desc="Permit staff to submit appraisals after the deadline has passed." />
          <ToggleRow settingKey="requirePublications" label="Require Publications for Academic Staff"
            desc="Academic staff must add at least one publication to submit their appraisal." />
          <ToggleRow settingKey="enableNotifications" label="Enable Email Notifications"
            desc="Send automated email reminders for deadlines and assessment updates." />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
