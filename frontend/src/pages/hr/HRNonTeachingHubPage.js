import { useNavigate } from 'react-router-dom';
import { LuUsers, LuBriefcase, LuArrowRight, LuArrowLeft } from 'react-icons/lu';

const HubCard = ({ title, subtitle, icon, color, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '2rem 1.75rem',
      cursor: 'pointer', transition: 'all 0.2s ease',
      display: 'flex', flexDirection: 'column', gap: '1rem',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{title}</div>
      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{subtitle}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color, fontSize: '0.825rem', fontWeight: 600 }}>
      View staff <LuArrowRight size={14} />
    </div>
  </div>
);

const HRNonTeachingHubPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <button
        onClick={() => navigate('/hr')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.825rem', padding: 0, marginBottom: '1.5rem' }}
      >
        <LuArrowLeft size={15} /> Back to Dashboard
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
          Non-Teaching Staff
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
          Select a category to view staff records, print appraisals, and export data.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <HubCard
          title="Junior Non-Teaching Staff"
          subtitle="Administrative, support, and technical staff at junior grades."
          icon={<LuUsers size={24} />}
          color="#f59e0b"
          onClick={() => navigate('/hr/non-teaching/junior')}
        />
        <HubCard
          title="Senior Non-Teaching Staff"
          subtitle="Senior administrative, managerial, and professional non-teaching staff."
          icon={<LuBriefcase size={24} />}
          color="#8b5cf6"
          onClick={() => navigate('/hr/non-teaching/senior')}
        />
      </div>
    </div>
  );
};

export default HRNonTeachingHubPage;
