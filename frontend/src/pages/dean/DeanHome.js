import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDeanStats } from '../../services/appraisalService';
import { LuUsers, LuCheckCircle2, LuScale, LuClipboardList, LuGavel, LuScrollText, LuShield } from 'react-icons/lu';
import WelcomeBanner from '../../components/ui/WelcomeBanner';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card-stat animate-fade-in">
    <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>);

const DeanHome = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const firstName = userProfile?.full_name?.split(' ')[0] || 'Dean';

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    getDeanStats()
      .then(setStats)
      .catch(err => console.error('Dean stats error:', err))
      .finally(() => setLoadingStats(false));
  }, []);

  const statCards = [
    { icon: <LuUsers size={20} />, label: 'Total College Staff', value: loadingStats ? '…' : (stats?.total_college_staff ?? '0'), color: '#3b82f6' },
    { icon: <LuCheckCircle2 size={20} />, label: 'Appraisals Submitted', value: loadingStats ? '…' : (stats?.appraisals_submitted ?? '0'), color: '#10b981' },
    { icon: <LuScale size={20} />, label: 'Active Invalidations', value: loadingStats ? '…' : (stats?.active_disputes ?? '0'), color: '#ef4444' },
    { icon: <LuGavel size={20} />, label: 'Pending CB Review', value: loadingStats ? '…' : (stats?.pending_college_board_review ?? '0'), color: '#f59e0b' },
  ];

  return (<div className="page-container stagger-children">
      <WelcomeBanner
        name={userProfile?.full_name || firstName}
        subtitle="Oversee all appraisals, assess HODs, and resolve disputes."
      />

      <div className="stats-grid">
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}></span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Assess HODs</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            You are the sole authority for assessing Heads of Department within your college.
          </p>
          <button onClick={() => navigate('/dean/assess')} className="btn btn-primary btn-sm">Assess HODs →</button>
        </div>

        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}></span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Resolve Invalidations</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Review and resolve invalidations raised by staff against HOD/HOU assessments.
          </p>
          {!loadingStats && stats?.active_disputes > 0
            ? <span className="badge badge-danger" style={{ marginBottom: '1rem' }}>{stats.active_disputes} Active Invalidation{stats.active_disputes > 1 ? 's' : ''}</span>
            : <span className="badge badge-success" style={{ marginBottom: '1rem' }}>No Active Invalidations</span>
          }
          <br />
          <button onClick={() => navigate('/dean/disputes')} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            View Disputes →
          </button>
        </div>

        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}></span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>My Appraisal</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Complete your own appraisal form for the current academic year.
          </p>
          <button onClick={() => navigate('/dean/appraisal')} className="btn btn-secondary btn-sm">
            My Appraisal →
          </button>
        </div>

        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}></span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>College Board Review</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Review HOD-assessed appraisals and submit college board recommendations (promotion, increment, etc.) for A&PC.
          </p>
          {!loadingStats && (stats?.pending_college_board_review ?? 0) > 0
            ? <span className="badge badge-warning" style={{ marginBottom: '1rem' }}>{stats.pending_college_board_review} Pending Review{stats.pending_college_board_review !== 1 ? 's' : ''}</span>
            : <span className="badge badge-success" style={{ marginBottom: '1rem' }}>All Reviewed</span>
          }
          <br />
          <button onClick={() => navigate('/dean/college-review')} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
            Review Queue →
          </button>
        </div>

        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}></span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>College Overview</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            View appraisal completion rates, department summaries, and college-wide statistics.
          </p>
          <button onClick={() => navigate('/dean/overview')} className="btn btn-secondary btn-sm">View Overview →</button>
        </div>

        <div className="card animate-fade-in" style={{ borderTop: '3px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <LuScrollText size={22} color="#3b82f6" />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Meeting Minutes</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Upload and manage official College Board meeting minutes. The system automatically cross-checks entries against appraisal records.
          </p>
          <button onClick={() => navigate('/dean/minutes')} className="btn btn-primary btn-sm">
            Manage Minutes →
          </button>
        </div>

        <div className="card animate-fade-in" style={{ borderTop: '3px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <LuShield size={22} color="#10b981" />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>External Assessors</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Assign and track external assessors for Senior Lecturer, Associate Professor, and Professor promotion candidates. Record report outcomes and submit final names to VC.
          </p>
          <button onClick={() => navigate('/dean/assessors')} className="btn btn-primary btn-sm">
            Manage Assessors →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeanHome;
