import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyAppraisal, getMyPublications } from '../../services/appraisalService';
import api from '../../services/api';
import { LuPrinter, LuArrowLeft } from 'react-icons/lu';

const BASE_PATH = {
  staff: '/staff',
  hod: '/hod', hou: '/hod', reporting_officer: '/hod',
  dean: '/dean', vc: '/dean',
};

const HR = () => (
  <div style={{ borderTop: '1.5px solid #1e3a8a', margin: '0.625rem 0 0.875rem' }} />
);

const CVSection = ({ title, children }) => {
  if (!children) return null;
  return (
    <div style={{ marginBottom: '1.125rem', pageBreakInside: 'avoid' }}>
      <div style={{
        fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#1e3a8a',
        marginBottom: '0.3rem',
      }}>
        {title}
      </div>
      <HR />
      {children}
    </div>
  );
};

const StaffCVPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const role = userProfile?.role;
  const basePath = BASE_PATH[role] || '/staff';
  const category = userProfile?.staff_category || 'junior_nonteaching';
  const isAcademic = category === 'academic';

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
  const fullName = userProfile?.full_name || `${p.surname || ''} ${p.firstName || ''}`.trim() || 'Staff Member';
  const department = p.department || userProfile?.department || '';
  const college = p.college || userProfile?.college || '';
  const staffId = userProfile?.staff_id || p.staffId || '';
  const rank = p.rank || userProfile?.current_rank || (isAcademic ? 'Academic Staff' : p.designation || 'Staff');

  const fmtDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading CV…
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cv-print-root, #cv-print-root * { visibility: visible !important; }
          #cv-print-root { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
          .cv-screen-only { display: none !important; }
          @page { margin: 18mm 20mm; size: A4; }
        }
      `}</style>

      {/* ── Screen-only header controls ── */}
      <div className="cv-screen-only page-container">
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title">Personal CV</h1>
              <p className="page-subtitle">Review your CV below, then print or save as PDF</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => navigate(`${basePath}/biodata`)} className="btn btn-secondary">
                <LuArrowLeft size={15} /> Back to Profile
              </button>
              <button onClick={() => navigate(`${basePath}/official-cv`)} className="btn btn-secondary">
                Official Crawford CV
              </button>
              <button onClick={() => window.print()} className="btn btn-primary">
                <LuPrinter size={15} /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>

        <div className="alert alert-info cv-screen-only" style={{ marginBottom: '1.5rem' }}>
          <span>
            To save as PDF: click <strong>Print / Save as PDF</strong>, then in the browser print dialog set destination to <strong>Save as PDF</strong>.
          </span>
        </div>
      </div>

      {/* ── CV Content (printed + previewed) ── */}
      <div id="cv-print-root" style={{
        maxWidth: 760, margin: '0 auto', padding: '2.5rem 2rem',
        background: '#ffffff', color: '#111',
        fontFamily: '"Times New Roman", Times, Georgia, serif',
        fontSize: '10pt', lineHeight: 1.45,
        border: '1px solid var(--border)', borderRadius: 4,
      }}>

        {/* ── Name & contact header ── */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '3px double #1e3a8a' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.06em', marginBottom: '0.3rem', color: '#0f172a' }}>
            {fullName.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.4rem' }}>
            {[rank, department, ...(isAcademic && college ? [college] : [])].filter(Boolean).join(' · ')}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#4b5563', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem 1.25rem' }}>
            <span>&#9993; {userProfile?.email}</span>
            {p.phone && <span>&#9742; {p.phone}</span>}
            {p.linkedIn && <span>LinkedIn: {p.linkedIn.replace(/^https?:\/\/(www\.)?/, '')}</span>}
          </div>
          {isAcademic && (p.orcid || p.googleScholar) && (
            <div style={{ fontSize: '0.775rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {p.orcid && <span>ORCID: orcid.org/{p.orcid} </span>}
              {p.googleScholar && <span> &nbsp;&middot;&nbsp; Google Scholar: {p.googleScholar.replace(/^https?:\/\/(www\.)?/, '')}</span>}
            </div>
          )}
        </div>

        {/* Personal Statement */}
        {p.personalStatement && (
          <CVSection title="Personal Statement">
            <p style={{ color: '#374151', lineHeight: 1.7 }}>{p.personalStatement}</p>
          </CVSection>
        )}

        {/* Education */}
        {(p.highestQualification || p.qualifyingInstitution) && (
          <CVSection title="Education">
            <div style={{ marginBottom: 4 }}>
              <strong>{p.highestQualification}</strong>
              {p.qualifyingInstitution ? ` — ${p.qualifyingInstitution}` : ''}
              {p.yearAwarded ? `, ${p.yearAwarded}` : ''}
            </div>
            {isAcademic && p.professionalQualification && (
              <div>
                <strong>{p.professionalQualification}</strong>
                {p.qualifyingBody ? ` — ${p.qualifyingBody}` : ''}
                {p.professionalYear ? `, ${p.professionalYear}` : ''}
              </div>
            )}
          </CVSection>
        )}

        {/* Professional Experience */}
        <CVSection title="Professional Experience">
          <div>
            <strong>Crawford University, Igbesa, Ogun State, Nigeria</strong>
          </div>
          <div style={{ color: '#374151' }}>
            {rank}
            {department ? ` — ${isAcademic ? `Dept. of ${department}` : department}` : ''}
          </div>
          {p.dateOfFirstAppointment && (
            <div style={{ color: '#6b7280', fontSize: '0.85em' }}>
              {fmtDate(p.dateOfFirstAppointment)} &ndash; Present
            </div>
          )}
        </CVSection>

        {/* Research Interests */}
        {isAcademic && p.researchInterests && (
          <CVSection title="Research Interests">
            <p style={{ color: '#374151' }}>{p.researchInterests}</p>
          </CVSection>
        )}

        {/* Publications */}
        {publications.length > 0 && (
          <CVSection title={`Publications (${publications.length})`}>
            {publications.map((pub, i) => (
              <div key={i} style={{ marginBottom: '0.4rem', paddingLeft: '1.5em', position: 'relative', fontSize: '0.9em' }}>
                <span style={{ position: 'absolute', left: 0 }}>{i + 1}.</span>
                {pub.authors ? `${pub.authors}. ` : ''}
                <strong>"{pub.title}"</strong>
                {pub.journal_name ? `. ${pub.journal_name}` : ''}
                {pub.year_of_publication ? `, ${pub.year_of_publication}` : ''}
                {pub.isbn_issn ? <span style={{ color: '#4b5563' }}>, {pub.isbn_issn}</span> : ''}
              </div>
            ))}
          </CVSection>
        )}

        {/* Courses Taught */}
        {isAcademic && Array.isArray(p.coursesTaught) && p.coursesTaught.some(c => c.code) && (
          <CVSection title="Courses Taught">
            {p.coursesTaught.filter(c => c.code).map((c, i) => (
              <div key={i} style={{ marginBottom: '0.2rem', fontSize: '0.9em' }}>
                <strong>{c.code}</strong> &mdash; {c.title}
                {c.units ? ` (${c.units} units)` : ''}
                {c.students ? `, ${c.students} students` : ''}
                {c.level ? `, ${c.level} Level` : ''}
              </div>
            ))}
          </CVSection>
        )}

        {/* Graduate Supervision */}
        {isAcademic && Array.isArray(p.pgSupervision) && p.pgSupervision.some(s => s.studentName) && (
          <CVSection title="Graduate Supervision">
            {p.pgSupervision.filter(s => s.studentName).map((s, i) => (
              <div key={i} style={{ marginBottom: '0.25rem', fontSize: '0.9em' }}>
                <strong>{s.studentName}</strong> ({s.level})
                {s.thesisTitle ? ` — ${s.thesisTitle}` : ''}
                {s.status ? ` [${s.status}]` : ''}
              </div>
            ))}
          </CVSection>
        )}

        {/* Non-teaching: Duties */}
        {!isAcademic && p.duties && (
          <CVSection title="Roles &amp; Responsibilities">
            <p style={{ color: '#374151', lineHeight: 1.7 }}>{p.duties}</p>
          </CVSection>
        )}

        {/* Non-teaching: Achievements */}
        {!isAcademic && p.achievements && (
          <CVSection title="Achievements">
            <p style={{ color: '#374151', lineHeight: 1.7 }}>{p.achievements}</p>
          </CVSection>
        )}

        {/* Professional Memberships */}
        {isAcademic && Array.isArray(p.professionalBodies) && p.professionalBodies.some(b => b.name) && (
          <CVSection title="Professional Memberships">
            {p.professionalBodies.filter(b => b.name).map((b, i) => (
              <div key={i} style={{ marginBottom: '0.2rem', fontSize: '0.9em' }}>
                <strong>{b.name}</strong>
                {b.type ? ` — ${b.type}` : ''}
                {b.year ? ` (${b.year})` : ''}
              </div>
            ))}
          </CVSection>
        )}

        {!isAcademic && p.professionalBodies && (
          <CVSection title="Professional Memberships">
            <p style={{ color: '#374151' }}>{p.professionalBodies}</p>
          </CVSection>
        )}

        {/* Non-teaching: Training */}
        {!isAcademic && Array.isArray(p.training) && p.training.some(t => t.title) && (
          <CVSection title="Training &amp; Professional Development">
            {p.training.filter(t => t.title).map((t, i) => (
              <div key={i} style={{ marginBottom: '0.25rem', fontSize: '0.9em' }}>
                <strong>{t.title}</strong>
                {t.organizer ? ` — ${t.organizer}` : ''}
                {t.date ? ` (${t.date})` : ''}
                {t.duration ? `, ${t.duration}` : ''}
              </div>
            ))}
          </CVSection>
        )}

        {/* Conferences */}
        {isAcademic && p.conferences && (
          <CVSection title="Conferences &amp; Workshops">
            <p style={{ color: '#374151', lineHeight: 1.7 }}>{p.conferences}</p>
          </CVSection>
        )}

        {/* Admin Responsibilities */}
        {isAcademic && p.adminResponsibilities && (
          <CVSection title="Administrative Responsibilities">
            <p style={{ color: '#374151', lineHeight: 1.7 }}>{p.adminResponsibilities}</p>
          </CVSection>
        )}

        {/* Community Service */}
        {isAcademic && p.communityService && (
          <CVSection title="Community Service">
            <p style={{ color: '#374151', lineHeight: 1.7 }}>{p.communityService}</p>
          </CVSection>
        )}

        {/* Research Profile Links */}
        {isAcademic && (p.scopus || p.researchgate || p.academia) && (
          <CVSection title="Research Profiles">
            {p.scopus && <div style={{ fontSize: '0.85em' }}>Scopus: {p.scopus}</div>}
            {p.researchgate && <div style={{ fontSize: '0.85em' }}>ResearchGate: {p.researchgate}</div>}
            {p.academia && <div style={{ fontSize: '0.85em' }}>Academia.edu: {p.academia}</div>}
            {Array.isArray(p.otherLinks) && p.otherLinks.filter(l => l.label && l.url).map((l, i) => (
              <div key={i} style={{ fontSize: '0.85em' }}>{l.label}: {l.url}</div>
            ))}
          </CVSection>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '2rem', paddingTop: '0.625rem',
          borderTop: '1px solid #d1d5db',
          textAlign: 'center', fontSize: '0.725rem', color: '#9ca3af',
        }}>
          Crawford University, Igbesa, Ogun State
          {staffId ? ` · Staff ID: ${staffId}` : ''}
          {' '}&middot; Generated{' '}
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </>
  );
};

export default StaffCVPage;
