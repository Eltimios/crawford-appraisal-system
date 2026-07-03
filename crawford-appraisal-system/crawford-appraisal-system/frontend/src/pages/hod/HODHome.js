import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDepartmentAppraisals } from '../../services/appraisalService';
import { LuUsers, LuCheckCircle2, LuClock, LuScale, LuPencilLine, LuClipboardList } from 'react-icons/lu';
import WelcomeBanner from '../../components/ui/WelcomeBanner';
import axios from 'axios';

const YEAR = '2025/2026';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card-stat animate-fade-in">
    <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>);

const HODHome = () => {
  const { userProfile, userRole } = useAuth();
  const navigate = useNavigate();
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myAppraisal, setMyAppraisal] = useState(null);

  const isReportingOfficer = userRole === 'reporting_officer';
  const firstName = userProfile?.full_name?.split(' ')[0] || (isReportingOfficer ? 'Reporting Officer' : 'HOD');

  useEffect(() => {
    if (!userProfile?.id) return;
    setLoading(true);
    Promise.all([
      getDepartmentAppraisals(userProfile.department, YEAR)
        .then(normalized => {
          // normalized has mapped statuses — re-fetch raw for accurate status counts
          setAppraisals(normalized);
        })
        .catch(err => console.error('HODHome dept appraisals error:', err)),
      axios.get('/api/appraisals/my', { params: { year: YEAR } })
        .then(res => {
          const list = res.data.appraisals || [];
          setMyAppraisal(list.find(a => a.appraisal_year === YEAR) || list[0] || null);
        })
        .catch(err => console.error('HODHome my appraisal error:', err)),
    ]).finally(() => setLoading(false));
  }, [userProfile?.id]);

  // getDepartmentAppraisals returns normalized statuses
  const pending = appraisals.filter(a => a.status === 'submitted').length;
  const assessed = appraisals.filter(a => a.status === 'assessed').length;
  const disputed = appraisals.filter(a => a.status === 'disputed').length;
  const total = appraisals.length;

  const myStatus = myAppraisal?.status || null;
  const myStatusLabel = {
    draft: ' Draft Saved',
    submitted: ' Submitted',
    hod_assessed: ' Assessed',
    college_board_reviewing: ' Under CB Review',
    college_board_approved: ' CB Approved',
    staff_viewed: ' Viewed by Staff',
    disputed: ' Invalidated',
    dean_resolved: ' Resolved',
    completed: ' Completed',
  }[myStatus] || ' Not Started';

  const stats = [
    { icon: <LuUsers size={20} />, label: 'Staff to Assess', value: loading ? '…' : total, color: '#3b82f6' },
    { icon: <LuCheckCircle2 size={20} />, label: 'Assessed', value: loading ? '…' : assessed, color: '#10b981' },
    { icon: <LuClock size={20} />, label: 'Pending', value: loading ? '…' : pending, color: '#f59e0b' },
    { icon: <LuScale size={20} />, label: 'Invalidations', value: loading ? '…' : disputed, color: '#ef4444' },
  ];

  return (<div className="page-container stagger-children">
    <WelcomeBanner
      name={userProfile?.full_name || firstName}
      subtitle={isReportingOfficer ? "Manage your assigned non-teaching staff appraisals." : "Manage your department's appraisals and assessments."}
    />

    <div className="stats-grid">
      {stats.map((s, i) => <StatCard key={i} {...s} />)}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
      <div className="card animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}></span>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{isReportingOfficer ? 'Assess My Staff' : 'Assess Staff'}</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          {isReportingOfficer
            ? 'Grade and recommend the non-teaching staff assigned to you who have submitted their appraisal forms.'
            : 'Grade and recommend staff members who have submitted their appraisal forms.'}
        </p>
        {loading ? (
          <div className="badge badge-secondary" style={{ marginBottom: '1rem' }}>Loading…</div>
        ) : pending > 0 ? (
          <div className="badge badge-warning" style={{ marginBottom: '1rem' }}>{pending} Pending Review{pending !== 1 ? 's' : ''}</div>
        ) : (
          <div className="badge badge-success" style={{ marginBottom: '1rem' }}>All Assessed</div>
        )}
        <br />
        <button onClick={() => navigate('/hod/assess')} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
          View Queue →
        </button>
      </div>

      <div className="card animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}></span>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>My Appraisal</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          {isReportingOfficer
            ? 'Complete your own appraisal form. Reporting Officers are assessed by the Registry.'
            : 'Complete your own appraisal form. HODs are assessed by the Dean of College.'}
        </p>
        <div className={`badge ${myStatus ? 'badge-info' : 'badge-warning'}`} style={{ marginBottom: '1rem' }}>
          {loading ? 'Loading…' : myStatusLabel}
        </div>
        <br />
        <button onClick={() => navigate('/hod/appraisal')} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
          {myStatus ? 'View Appraisal →' : 'Start Appraisal →'}
        </button>
      </div>

      <div className="card animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}></span>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Counter-Comments</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          View invalidations raised by staff members against your assessments.
        </p>
        {loading ? (
          <div className="badge badge-secondary" style={{ marginBottom: '1rem' }}>Loading…</div>
        ) : disputed > 0 ? (
          <div className="badge badge-danger" style={{ marginBottom: '1rem' }}>{disputed} Active Invalidation{disputed !== 1 ? 's' : ''}</div>
        ) : (
          <div className="badge badge-success" style={{ marginBottom: '1rem' }}>No Active Invalidations</div>
        )}
        <br />
        <button
          onClick={() => navigate('/hod/assess')}
          className="btn btn-secondary btn-sm"
          style={{ marginTop: '0.75rem' }}
          disabled={disputed === 0}
        >
          View Invalidations
        </button>
      </div>
    </div>

    <div className="card animate-fade-in" style={{ marginTop: '1.25rem' }}>
      <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>{isReportingOfficer ? 'Assigned Staff' : 'Department Staff'} ({YEAR})</h3>
      {loading ? (
        <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading…</div>
      ) : appraisals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">—</div>
          <div className="empty-state-title">No submissions yet</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Staff who submit their appraisal forms will appear here.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appraisals.map(a => {
                const u = a.users || {};
                const statusMap = {
                  draft: { label: 'Draft', cls: 'badge-secondary' },
                  submitted: { label: 'Awaiting Assessment', cls: 'badge-warning' },
                  assessed: { label: 'Assessed', cls: 'badge-success' },
                  viewed: { label: 'Viewed', cls: 'badge-primary' },
                  disputed: { label: 'Invalidated', cls: 'badge-danger' },
                  resolved: { label: 'Resolved', cls: 'badge-success' },
                };
                const s = statusMap[a.status] || { label: a.status, cls: 'badge-secondary' };
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {a.part1?.surname} {a.part1?.firstName}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {a.category === 'academic' ? 'Academic' : a.category === 'senior_nonteaching' ? 'Senior NT' : 'Junior NT'}
                      </span>
                    </td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
  );
};

export default HODHome;
