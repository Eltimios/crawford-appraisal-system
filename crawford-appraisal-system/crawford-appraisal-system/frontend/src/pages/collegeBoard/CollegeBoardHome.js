import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { getApprovedCollegeBoardReviews } from '../../services/appraisalService';
import { LuInbox, LuCheckCircle2, LuFlag, LuBarChart2 } from 'react-icons/lu';
import WelcomeBanner from '../../components/ui/WelcomeBanner';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card-stat animate-fade-in">
    <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>);

const CollegeBoardHome = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(0);
  const [approved, setApproved] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = userProfile?.full_name?.split(' ')[0] || 'Member';

  useEffect(() => {
    if (!userProfile) return;
    Promise.all([
      axios.get('/api/assessments/college-board/pending').catch(() => ({ data: { appraisals: [] } })),
      getApprovedCollegeBoardReviews().catch(() => []),
    ]).then(([pendingRes, approvedList]) => {
      const list = pendingRes.data.appraisals || [];
      setPending(list.length);
      setRecentActivity(list.slice(0, 5));
      setApproved(approvedList.length);
    }).finally(() => setLoading(false));
  }, [userProfile?.id]);

  const stats = [
    { icon: <LuInbox size={20} />, label: 'Pending Reviews', value: loading ? '…' : pending,            color: '#f59e0b' },
    { icon: <LuCheckCircle2 size={20} />, label: 'Approved',         value: loading ? '…' : approved,           color: '#10b981' },
    { icon: <LuFlag size={20} />, label: 'Flagged',          value: '—',                                color: '#ef4444' },
    { icon: <LuBarChart2 size={20} />, label: 'Total Reviewed',   value: loading ? '…' : approved,           color: '#3b82f6' },
  ];

  return (<div className="page-container stagger-children">
      <WelcomeBanner
        name={userProfile?.full_name || firstName}
        subtitle="Review and approve HOD assessments for academic staff."
      />

      <div className="alert alert-info animate-fade-in" style={{ marginBottom: '1.5rem' }}>
        <span>ℹ</span>
        <div>
          <strong>Your Role:</strong> You review HOD/HOU assessments for <strong>Academic Staff only</strong> before
          staff are allowed to view them. You do not assess, promote, or resolve invalidations.
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}></span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Review Queue</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Academic staff assessments submitted by HODs/HOUs awaiting your review.
          </p>
          {loading ? (
            <div className="badge badge-secondary" style={{ marginBottom: '1rem' }}>Loading…</div>
          ) : pending > 0 ? (
            <div className="badge badge-warning" style={{ marginBottom: '1rem' }}>{pending} Pending</div>
          ) : (
            <div className="badge badge-success" style={{ marginBottom: '1rem' }}>Queue Empty</div>
          )}
          <br />
          <button onClick={() => navigate('/college-board/review')} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
            Open Queue →
          </button>
        </div>

        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}></span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Approved Reviews</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            View all assessments you have previously approved for this academic session.
          </p>
          <div className="badge badge-success" style={{ marginBottom: '1rem' }}>
            View Approved
          </div>
          <br />
          <button onClick={() => navigate('/college-board/approved')} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            View Approved →
          </button>
        </div>
      </div>

      <div className="card animate-fade-in" style={{ marginTop: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Pending Queue</h3>
        {loading ? (
          <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading…</div>
        ) : recentActivity.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No pending reviews</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Assessments submitted by HODs will appear here for your review.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Staff Name</th><th>Department</th><th>HOD Grade</th><th>Action</th></tr>
              </thead>
              <tbody>
                {recentActivity.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {a.part1?.surname} {a.part1?.firstName}
                    </td>
                    <td>{a.part1?.department || '—'}</td>
                    <td>
                      {a.hodAssessment?.overallGrade
                        ? <span className="badge badge-primary">{a.hodAssessment.overallGrade}</span>
                        : '—'}
                    </td>
                    <td>
                      <button onClick={() => navigate('/college-board/review')} className="btn btn-primary btn-sm">
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeBoardHome;
