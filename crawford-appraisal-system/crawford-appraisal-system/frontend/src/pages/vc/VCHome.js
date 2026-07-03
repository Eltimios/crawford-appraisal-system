import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDeanSubmissions } from '../../services/appraisalService';
import { LuUsers, LuCheckCircle2, LuClock, LuUserCheck, LuShield } from 'react-icons/lu';
import WelcomeBanner from '../../components/ui/WelcomeBanner';

const YEAR = '2025/2026';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card-stat animate-fade-in">
    <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const VCHome = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeanSubmissions(YEAR)
      .then(setAppraisals)
      .catch(() => setAppraisals([]))
      .finally(() => setLoading(false));
  }, []);

  const total = appraisals.length;
  const assessed = appraisals.filter(a => a.rawStatus !== 'submitted').length;
  const pending = appraisals.filter(a => a.rawStatus === 'submitted').length;

  const statCards = [
    { icon: <LuUsers size={20} />, label: 'Total Dean Submissions', value: loading ? '…' : total, color: '#3b82f6' },
    { icon: <LuCheckCircle2 size={20} />, label: 'Deans Assessed', value: loading ? '…' : assessed, color: '#10b981' },
    { icon: <LuClock size={20} />, label: 'Pending Assessment', value: loading ? '…' : pending, color: '#f59e0b' },
  ];

  return (
    <div className="page-container stagger-children">
      <WelcomeBanner
        name={userProfile?.full_name || 'Vice Chancellor'}
        subtitle="Assess Deans of Colleges and oversee the university appraisal process."
      />

      <div className="stats-grid">
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Assess Deans</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Review and assess Deans who have submitted their appraisals. After your assessment, submissions are forwarded to the A&PC.
          </p>
          {!loading && pending > 0 && (
            <span className="badge badge-warning" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
              {pending} Dean{pending > 1 ? 's' : ''} awaiting assessment
            </span>
          )}
          {!loading && pending === 0 && (
            <span className="badge badge-success" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
              All Deans assessed
            </span>
          )}
          <br />
          <button onClick={() => navigate('/vc/assess-deans')} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
            <LuUserCheck size={14} style={{ marginRight: '0.375rem' }} />
            Assess Deans →
          </button>
        </div>

        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <LuShield size={22} color="#10b981" />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Final Assessor Selection</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Select 3 final external assessors (1 international + 2 national) from the 6 names submitted by the Dean for professorial promotion candidates with PFQ established.
          </p>
          <button onClick={() => navigate('/vc/assessors')} className="btn btn-primary btn-sm">
            <LuShield size={14} style={{ marginRight: '0.375rem' }} />
            Select Assessors →
          </button>
        </div>

        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏛️</span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>University Overview</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            View a university-wide summary of appraisal progress across all colleges and departments.
          </p>
          <button onClick={() => navigate('/vc/overview')} className="btn btn-secondary btn-sm">
            View Overview →
          </button>
        </div>
      </div>
    </div>
  );
};

export default VCHome;
