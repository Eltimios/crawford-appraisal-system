import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LuClipboardList, LuBarChart2, LuBookOpen, LuAward } from 'react-icons/lu';
import WelcomeBanner from '../../components/ui/WelcomeBanner';
import axios from 'axios';

const YEAR = '2025/2026';

const STATUS_CONFIG = {
  draft:                        { label: 'Draft Saved',              short: 'Draft',        badge: 'badge-warning' },
  submitted:                    { label: 'Awaiting Assessment',      short: 'Submitted',    badge: 'badge-info'    },
  hod_assessed:                 { label: 'Assessed — Awaiting View', short: 'Assessed',     badge: 'badge-success' },
  reporting_officer_assessed:   { label: 'Assessed',                 short: 'Assessed',     badge: 'badge-success' },
  registry_validated:           { label: 'Registry Validated',       short: 'Validated',    badge: 'badge-success' },
  college_board_reviewing:      { label: 'Under CB Review',          short: 'CB Review',    badge: 'badge-info'    },
  college_board_approved:       { label: 'Assessment Approved',      short: 'CB Approved',  badge: 'badge-success' },
  college_board_reviewed:       { label: 'CB Reviewed — Sent to APC', short: 'CB Reviewed', badge: 'badge-success' },
  staff_viewed:                 { label: 'Assessment Viewed',        short: 'Viewed',       badge: 'badge-primary' },
  dispute_raised:               { label: 'Invalidation Submitted',           short: 'Invalidated',  badge: 'badge-warning' },
  disputed:                     { label: 'Invalidation Pending — Awaiting Dean', short: 'Invalidated',  badge: 'badge-danger'  },
  dean_resolved:                { label: 'Invalidation Resolved',            short: 'Resolved',     badge: 'badge-success' },
  apc_recommended:              { label: 'A&PC Review — Pending Council',    short: 'A&PC Reviewed',   badge: 'badge-success' },
  pending_council:              { label: 'Pending Council Approval',         short: 'Pending Council', badge: 'badge-info'    },
  council_decided:              { label: 'Council Decision Recorded',        short: 'Council Decided', badge: 'badge-success' },
  completed:                    { label: 'Completed',                short: 'Completed',    badge: 'badge-success' },
};

const ASSESSED_STATUSES = [
  'hod_assessed', 'reporting_officer_assessed', 'registry_validated',
  'college_board_reviewing', 'college_board_approved', 'college_board_reviewed',
  'staff_viewed', 'dispute_raised', 'disputed', 'dean_resolved',
  'apc_recommended', 'pending_council', 'council_decided', 'completed',
];

const StatCard = ({ icon, label, value, color }) => (
  <div className="card-stat animate-fade-in">
    <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div className="stat-value" style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>);

const StaffHome = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [appraisal, setAppraisal] = useState(null);
  const [pubCount, setPubCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAcademic = userProfile?.staff_category === 'academic';
  const firstName = userProfile?.full_name?.split(' ')[0] || 'Staff';

  useEffect(() => {
    const fetches = [
      axios.get('/api/appraisals/my', { params: { year: YEAR } })
        .then(res => {
          const list = res.data.appraisals || [];
          const match = list.find(a => a.appraisal_year === YEAR) || list[0] || null;
          setAppraisal(match);
        })
        .catch(() => {}),
    ];
    if (isAcademic) {
      fetches.push(
        axios.get('/api/publications/my')
          .then(res => setPubCount((res.data.publications || []).length))
          .catch(() => {})
      );
    }
    Promise.all(fetches).finally(() => setLoading(false));
  }, [isAcademic]);

  const status = appraisal?.status || null;
  const statusCfg = STATUS_CONFIG[status] || null;
  const canViewAssessment = appraisal && ASSESSED_STATUSES.includes(status);

  const timelineSteps = [
    {
      step: '1', label: 'Submit Appraisal Form', date: 'Due: Mar 31, 2026',
      done: status && status !== 'draft',
      active: !status || status === 'draft',
    },
    {
      step: '2', label: isAcademic ? 'HOD/HOU Assessment' : 'Reporting Officer Assessment', date: 'After your submission',
      done: ASSESSED_STATUSES.includes(status),
      active: status === 'submitted',
    },
    {
      step: '3', label: 'View & Comment on Assessment', date: 'After assessment is ready',
      done: ['staff_viewed', 'dispute_raised', 'disputed', 'dean_resolved', 'college_board_reviewed', 'apc_recommended', 'pending_council', 'council_decided', 'completed'].includes(status),
      active: canViewAssessment && !['staff_viewed', 'dispute_raised', 'disputed', 'dean_resolved', 'college_board_reviewed', 'apc_recommended', 'pending_council', 'council_decided', 'completed'].includes(status),
    },
    {
      step: '4', label: 'College Board Review', date: isAcademic ? 'Dean reviews and recommends' : 'Not applicable',
      done: ['college_board_reviewed', 'apc_recommended', 'pending_council', 'council_decided', 'completed'].includes(status),
      active: ['staff_viewed', 'dispute_raised', 'dean_resolved'].includes(status),
      skip: !isAcademic,
    },
    {
      step: isAcademic ? '5' : '4', label: 'Promotion Review (A&PC)', date: 'End of session',
      done: ['apc_recommended', 'pending_council', 'council_decided', 'completed'].includes(status),
      active: isAcademic ? status === 'college_board_reviewed' : ASSESSED_STATUSES.includes(status) && !['apc_recommended', 'pending_council', 'council_decided', 'completed'].includes(status),
    },
    {
      step: isAcademic ? '6' : '5', label: 'Council Decision', date: 'Final approval',
      done: ['council_decided', 'completed'].includes(status),
      active: ['apc_recommended', 'pending_council'].includes(status),
    },
  ];

  const lastScore = (() => {
    if (loading || !appraisal?.hod_grades) return 'N/A';
    if (isAcademic) return appraisal.hod_grades.overallGrade || 'N/A';
    const t = appraisal.hod_grades.totalScore;
    const max = appraisal.staff_category === 'senior_nonteaching' ? 100 : 75;
    return t != null ? `${t}/${max}` : 'N/A';
  })();

  const stats = [
    { icon: <LuClipboardList size={20} />, label: 'Appraisal Status', value: loading ? '…' : statusCfg ? statusCfg.short : 'Not Started', color: '#f59e0b' },
    { icon: <LuBarChart2 size={20} />,    label: 'Last Score',       value: lastScore, color: '#3b82f6' },
    { icon: <LuBookOpen size={20} />,     label: 'Publications',     value: isAcademic ? (loading ? '…' : pubCount) : 'N/A', color: '#8b5cf6' },
    { icon: <LuAward size={20} />,        label: 'Promotion Status', value: status === 'completed' ? 'Under Review' : 'Not Due', color: '#10b981' },
  ];

  return (<div className="page-container stagger-children">
      <WelcomeBanner
        name={userProfile?.full_name || firstName}
        subtitle={`Your appraisal overview for the ${YEAR} academic year.`}
      />

      <div className="stats-grid">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}></span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Appraisal Form</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Complete your annual performance appraisal form for the current academic year.
          </p>
          {loading ? (
            <div className="badge badge-secondary" style={{ marginBottom: '1rem' }}>Loading…</div>
          ) : statusCfg ? (
            <div className={`badge ${statusCfg.badge}`} style={{ marginBottom: '1rem' }}>{statusCfg.label}</div>
          ) : (
            <div className="badge badge-warning" style={{ marginBottom: '1rem' }}>Not Started</div>
          )}
          <br />
          <button
            onClick={() => navigate('/staff/appraisal')}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '0.75rem' }}
            disabled={status === 'submitted' || (status && status !== 'draft')}
          >
            {status === 'draft' ? 'Continue Appraisal →' : status ? 'View Appraisal →' : 'Start Appraisal →'}
          </button>
        </div>

        {isAcademic && (
          <div className="card animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}></span>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Publications</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Upload your research papers, books, and conference proceedings for promotion scoring.
            </p>
            <div className="badge badge-secondary" style={{ marginBottom: '1rem' }}>{pubCount} Uploaded</div>
            <br />
            <button onClick={() => navigate('/staff/publications')} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
              Manage Publications →
            </button>
          </div>
        )}

        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}></span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>My Assessment</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            {isAcademic
              ? 'View your HOD assessment, then accept it or submit a comment before College Board review.'
              : 'View your Reporting Officer assessment once it is complete.'}
          </p>
          {loading ? (
            <div className="badge badge-secondary" style={{ marginBottom: '1rem' }}>Loading…</div>
          ) : canViewAssessment ? (
            <div className="badge badge-success" style={{ marginBottom: '1rem' }}>Assessment Ready</div>
          ) : (
            <div className="badge badge-secondary" style={{ marginBottom: '1rem' }}>
              {status === 'submitted'
                ? isAcademic ? 'Awaiting HOD Assessment' : 'Awaiting Reporting Officer Assessment'
                : 'Awaiting Submission'}
            </div>
          )}
          <br />
          <button
            onClick={() => navigate('/staff/assessment')}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '0.75rem' }}
            disabled={!canViewAssessment}
          >
            View Assessment
          </button>
        </div>
      </div>

      <div className="card animate-fade-in" style={{ marginTop: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Appraisal Timeline {YEAR}</h3>
        {timelineSteps.filter(s => !s.skip).map((item, i, arr) => (
          <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: i < arr.length - 1 ? '1rem' : 0, alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: item.done ? 'rgba(16,185,129,0.2)' : item.active ? 'rgba(245,158,11,0.2)' : 'var(--bg-hover)',
              border: `2px solid ${item.done ? '#10b981' : item.active ? '#f59e0b' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700,
              color: item.done ? '#10b981' : item.active ? '#f59e0b' : 'var(--text-muted)',
            }}>{item.done ? '' : item.step}</div>
            <div>
              <div style={{ fontWeight: 600, color: item.done || item.active ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{item.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffHome;
