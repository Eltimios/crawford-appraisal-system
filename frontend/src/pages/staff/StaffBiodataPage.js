import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyAppraisal, getMyPublications } from '../../services/appraisalService';
import api from '../../services/api';
import {
  LuPhone, LuMail, LuBuilding2, LuMapPin, LuExternalLink,
  LuPencilLine, LuDownload, LuUser, LuBookOpen, LuGraduationCap,
  LuAward, LuCalendar, LuAtom, LuLink, LuClock,
} from 'react-icons/lu';

const BASE_PATH = {
  staff: '/staff',
  hod: '/hod', hou: '/hod', reporting_officer: '/hod',
  dean: '/dean', vc: '/dean',
};

const ProfileLink = ({ href, label }) => {
  if (!href) return null;
  return (
    <a
      href={href.startsWith('http') ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.375rem 0.75rem', borderRadius: 6,
        background: 'var(--bg-hover)', color: 'var(--primary-light)',
        fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none',
        border: '1px solid var(--border)', transition: 'all 0.15s',
      }}
    >
      <LuExternalLink size={12} /> {label}
    </a>
  );
};

const Section = ({ title, icon: Icon, children }) => (
  <div style={{
    marginBottom: '1rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1.25rem 1.5rem',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      marginBottom: '0.875rem', paddingBottom: '0.5rem',
      borderBottom: '1px solid var(--border)',
    }}>
      <Icon size={15} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
      <h3 style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const StaffBiodataPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const role = userProfile?.role;
  const basePath = BASE_PATH[role] || '/staff';
  const category = userProfile?.staff_category || 'junior_nonteaching';
  const isAcademic = category === 'academic';
  const lastSection = isAcademic ? 4 : 3;

  const [appraisal, setAppraisal] = useState(null);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cycleYear, setCycleYear] = useState('2025/2026');

  useEffect(() => {
    api.get('/settings/cycle-status')
      .then(res => setCycleYear(res.data.current_year || '2025/2026'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userProfile || !cycleYear) return;
    Promise.all([
      getMyAppraisal(userProfile.id, cycleYear),
      getMyPublications(userProfile.id),
    ]).then(([app, pubs]) => {
      setAppraisal(app);
      setPublications(pubs.publications || []);
    }).finally(() => setLoading(false));
  }, [userProfile, cycleYear]);

  const p = appraisal?.part1 || {};

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading profile…
        </div>
      </div>
    );
  }

  const hasData = !!appraisal;

  return (
    <div className="page-container">
      {/* ── Profile Header ── */}
      <div style={{ marginBottom: '2rem', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Cover gradient */}
        <div style={{
          height: 130,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)',
        }} />

        {/* Profile card */}
        <div style={{ background: 'var(--bg-secondary)', padding: '0 1.75rem 1.75rem' }}>
          {/* Avatar + actions row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -52, flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{
              width: 104, height: 104, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.25rem', fontWeight: 800, color: '#fff',
              border: '4px solid var(--bg-secondary)', flexShrink: 0,
              letterSpacing: '0.05em',
            }}>
              {getInitials(userProfile?.full_name)}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '3.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`${basePath}/appraisal`, { state: { section: lastSection } })}
              >
                <LuPencilLine size={14} /> Edit Biodata
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`${basePath}/cv`)}
              >
                <LuDownload size={14} /> Personal CV
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`${basePath}/official-cv`)}
              >
                <LuDownload size={14} /> Official Crawford CV
              </button>
            </div>
          </div>

          {/* Name & title */}
          <div style={{ marginTop: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {userProfile?.full_name || 'Staff Member'}
            </h1>
            <p style={{ color: 'var(--primary-light)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.625rem' }}>
              {p.rank || userProfile?.current_rank || (isAcademic ? 'Academic Staff' : p.designation || 'Non-Teaching Staff')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {(p.department || userProfile?.department) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <LuBuilding2 size={14} />
                  {p.department || userProfile?.department}
                </span>
              )}
              {isAcademic && (p.college || userProfile?.college) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <LuGraduationCap size={14} />
                  {p.college || userProfile?.college}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <LuUser size={14} />
                {userProfile?.staff_id || p.staffId || '—'}
              </span>
            </div>
          </div>

          {/* Contact quick bar */}
          <div style={{
            marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)',
            display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <LuMail size={14} /> {userProfile?.email}
            </span>
            {p.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <LuPhone size={14} /> {p.phone}
              </span>
            )}
            {isAcademic && p.officeRoomNumber && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <LuMapPin size={14} /> {p.officeRoomNumber}
              </span>
            )}
            {isAcademic && p.visitingHours && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <LuClock size={14} /> {p.visitingHours}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── No appraisal fallback ── */}
      {!hasData && (
        <div className="alert alert-warning">
          <div>
            <strong>No appraisal data found</strong>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.875rem' }}>
              Your biodata is built from your appraisal form. Please start your appraisal to populate this page.
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => navigate(`${basePath}/appraisal`)}
          >
            Start Appraisal
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      {hasData && (
        <div>

          {/* ── Left column ── */}
          <div>
            {p.personalStatement && (
              <Section title="About" icon={LuUser}>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.9rem' }}>
                  {p.personalStatement}
                </p>
              </Section>
            )}

            {isAcademic && p.researchInterests && (
              <Section title="Research Interests" icon={LuAtom}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {p.researchInterests.split(/,|\n/).filter(s => s.trim()).map((interest, i) => (
                    <span key={i} style={{
                      padding: '0.275rem 0.75rem', borderRadius: 20,
                      background: 'rgba(59,130,246,0.1)', color: 'var(--primary-light)',
                      fontSize: '0.8125rem', fontWeight: 600,
                    }}>
                      {interest.trim()}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {isAcademic && (
              <Section title="Research Profiles" icon={LuLink}>
                {(p.orcid || p.googleScholar || p.scopus || p.researchgate || p.academia || p.linkedIn || (Array.isArray(p.otherLinks) && p.otherLinks.some(l => l.label && l.url))) ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {p.orcid && <ProfileLink href={`https://orcid.org/${p.orcid}`} label="ORCID" />}
                    {p.googleScholar && <ProfileLink href={p.googleScholar} label="Google Scholar" />}
                    {p.scopus && <ProfileLink href={p.scopus} label="Scopus" />}
                    {p.researchgate && <ProfileLink href={p.researchgate} label="ResearchGate" />}
                    {p.academia && <ProfileLink href={p.academia} label="Academia.edu" />}
                    {p.linkedIn && <ProfileLink href={p.linkedIn} label="LinkedIn" />}
                    {Array.isArray(p.otherLinks) && p.otherLinks.filter(l => l.label && l.url).map((l, i) => (
                      <ProfileLink key={i} href={l.url} label={l.label} />
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No links added yet.{' '}
                    <button
                      onClick={() => navigate(`${basePath}/appraisal`, { state: { section: lastSection } })}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      Add links →
                    </button>
                  </p>
                )}
              </Section>
            )}

            {!isAcademic && p.linkedIn && (
              <Section title="Professional Links" icon={LuLink}>
                <ProfileLink href={p.linkedIn} label="LinkedIn" />
              </Section>
            )}

            <Section title="Education" icon={LuGraduationCap}>
              {(p.highestQualification || p.qualifyingInstitution) ? (
                <div>
                  <div style={{ marginBottom: p.professionalQualification ? '0.75rem' : 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {p.highestQualification || '—'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {p.qualifyingInstitution}{p.yearAwarded ? ` · ${p.yearAwarded}` : ''}
                    </div>
                  </div>
                  {isAcademic && p.professionalQualification && (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {p.professionalQualification}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {p.qualifyingBody}{p.professionalYear ? ` · ${p.professionalYear}` : ''}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No qualifications recorded.</p>
              )}
            </Section>

            {/* Professional memberships */}
            {isAcademic && Array.isArray(p.professionalBodies) && p.professionalBodies.some(b => b.name) && (
              <Section title="Professional Memberships" icon={LuAward}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {p.professionalBodies.filter(b => b.name).map((b, i) => (
                    <li key={i} style={{
                      padding: '0.4rem 0', borderBottom: '1px solid var(--border)',
                      fontSize: '0.875rem', color: 'var(--text-secondary)',
                    }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{b.name}</strong>
                      {b.type ? ` — ${b.type}` : ''}
                      {b.year ? ` (${b.year})` : ''}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {!isAcademic && p.professionalBodies && (
              <Section title="Professional Memberships" icon={LuAward}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                  {p.professionalBodies}
                </p>
              </Section>
            )}
          </div>

          {/* ── Right column ── */}
          <div>
            {publications.length > 0 && (
              <Section title={`Publications (${publications.length})`} icon={LuBookOpen}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {publications.map((pub, i) => (
                    <li key={i} style={{ padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', flex: 1 }}>
                          {pub.title}
                        </div>
                        {pub.file_url && (
                          <a
                            href={pub.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary-light)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '0.1rem 0.45rem', whiteSpace: 'nowrap' }}
                          >
                            View PDF
                          </a>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {pub.journal_name || pub.journal || pub.venue}
                        {(pub.year_of_publication || pub.year) ? ` · ${pub.year_of_publication || pub.year}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {isAcademic && Array.isArray(p.coursesTaught) && p.coursesTaught.some(c => c.code) && (
              <Section title="Courses Taught" icon={LuBookOpen}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Code', 'Course Title', 'Units'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '0.35rem 0.5rem',
                          color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.73rem',
                          textTransform: 'uppercase', borderBottom: '1px solid var(--border)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.coursesTaught.filter(c => c.code).map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{c.code}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{c.title}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>{c.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {isAcademic && Array.isArray(p.pgSupervision) && p.pgSupervision.some(s => s.studentName) && (
              <Section title="Postgraduate Supervision" icon={LuGraduationCap}>
                {p.pgSupervision.filter(s => s.studentName).map((s, i) => (
                  <div key={i} style={{
                    marginBottom: '0.625rem', paddingBottom: '0.625rem',
                    borderBottom: '1px solid var(--border)', fontSize: '0.875rem',
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {s.studentName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({s.level})</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{s.thesisTitle}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.status}</div>
                  </div>
                ))}
              </Section>
            )}

            {isAcademic && p.adminResponsibilities && (
              <Section title="Administrative Responsibilities" icon={LuCalendar}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                  {p.adminResponsibilities}
                </p>
              </Section>
            )}

            {isAcademic && p.communityService && (
              <Section title="Community Service" icon={LuAward}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                  {p.communityService}
                </p>
              </Section>
            )}

            {!isAcademic && p.duties && (
              <Section title="Roles &amp; Responsibilities" icon={LuCalendar}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                  {p.duties}
                </p>
              </Section>
            )}

            {!isAcademic && p.achievements && (
              <Section title="Achievements" icon={LuAward}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                  {p.achievements}
                </p>
              </Section>
            )}

            {!isAcademic && Array.isArray(p.training) && p.training.some(t => t.title) && (
              <Section title="Training &amp; Development" icon={LuGraduationCap}>
                {p.training.filter(t => t.title).map((t, i) => (
                  <div key={i} style={{
                    marginBottom: '0.5rem', paddingBottom: '0.5rem',
                    borderBottom: '1px solid var(--border)', fontSize: '0.875rem',
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {t.organizer}{t.date ? ` · ${t.date}` : ''}{t.duration ? ` · ${t.duration}` : ''}
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default StaffBiodataPage;
