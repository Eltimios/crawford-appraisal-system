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

const NEXT_RANK = {
  'Lecturer II': 'Lecturer I',
  'Lecturer I': 'Senior Lecturer',
  'Senior Lecturer': 'Associate Professor',
  'Associate Professor': 'Professor',
};

const StaffOfficialCVPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const role = userProfile?.role;
  const basePath = BASE_PATH[role] || '/staff';
  const isAcademic = (userProfile?.staff_category || '') === 'academic';

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
  const fullName = userProfile?.full_name || '';
  const department = p.department || userProfile?.department || '';
  const college    = p.college    || userProfile?.college    || '';
  const staffId    = userProfile?.staff_id || p.staffId || '';
  const rank       = p.rank || userProfile?.current_rank || (isAcademic ? 'Academic Staff' : p.designation || 'Staff');
  const postAppliedFor = p.postAppliedFor || NEXT_RANK[rank] || '';
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const journals    = publications.filter(x => x.publication_type === 'journal_article');
  const books       = publications.filter(x => ['refereed_book', 'edited_book'].includes(x.publication_type));
  const chapters    = publications.filter(x => x.publication_type === 'chapter_in_book');
  const conferences = publications.filter(x => ['conference_proceedings', 'conference_paper'].includes(x.publication_type));
  const otherPubs   = publications.filter(x => !['journal_article', 'refereed_book', 'edited_book', 'chapter_in_book', 'conference_proceedings', 'conference_paper'].includes(x.publication_type));

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading CV…
        </div>
      </div>
    );
  }

  /* shared inline styles */
  const doc = { fontFamily: '"Times New Roman", Times, serif', color: '#000', fontSize: '11pt', lineHeight: 1.5 };
  const secTitle = {
    fontWeight: 'bold', fontSize: '10.5pt', textTransform: 'uppercase',
    letterSpacing: '0.04em', borderBottom: '1px solid #000',
    paddingBottom: '2px', marginBottom: '6px', marginTop: '18px',
  };
  const th = {
    textAlign: 'left', padding: '4px 8px 4px 0', fontWeight: 'bold',
    borderBottom: '1px solid #000', fontSize: '10pt',
    textTransform: 'uppercase', letterSpacing: '0.03em',
  };
  const td = { padding: '3px 8px 3px 0', verticalAlign: 'top', fontSize: '10.5pt' };

  /* numbered personal details items 1–16 */
  const personalDetails = [
    ['NAME',                        fullName],
    ['POST APPLIED FOR',            isAcademic ? postAppliedFor : (p.designation || rank)],
    ['PRESENT POSITION',            rank],
    ['COLLEGE / FACULTY',           college],
    ['DEPARTMENT',                  department],
    ['STAFF ID',                    staffId],
    ['DATE OF FIRST APPOINTMENT',   p.dateFirstAppointed || p.dateOfFirstAppointment || ''],
    ['DATE OF PRESENT APPOINTMENT', p.dateCurrentPost || ''],
    ['SEX',                         p.sex || p.gender || ''],
    ['NATIONALITY',                 p.nationality || 'Nigerian'],
    ['STATE OF ORIGIN / LGA',       [p.stateOfOrigin, p.lga].filter(Boolean).join(' / ')],
    ['MARITAL STATUS',              p.maritalStatus || ''],
    ['RESIDENTIAL ADDRESS',         p.residentialAddress || p.address || ''],
    ['ADDRESS FOR CORRESPONDENCE',  p.correspondenceAddress || p.residentialAddress || p.address || ''],
    ['PHONE NUMBER(S)',              p.phone || ''],
    ['INSTITUTIONAL EMAIL ADDRESS', userProfile?.email || ''],
  ];

  return (
    <>
      <style>{`
        @media print {
          .cv-no-print { display: none !important; }
          body > * { display: none !important; }
          #official-cv-doc {
            display: block !important; position: static !important;
            box-shadow: none !important; border: none !important;
            max-width: none !important; margin: 0 !important; padding: 0 !important;
          }
          @page { margin: 18mm 22mm; size: A4 portrait; }
        }
      `}</style>

      {/* Screen action bar */}
      <div className="cv-no-print page-container" style={{ paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            onClick={() => navigate(`${basePath}/biodata`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.825rem', padding: 0 }}
          >
            <LuArrowLeft size={15} /> Back to Biodata
          </button>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => navigate(`${basePath}/cv`)} className="btn btn-secondary">
              Personal CV
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Print → "Save as PDF" to download
            </span>
            <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LuPrinter size={15} /> Print / Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* CV Document */}
      <div id="official-cv-doc" style={{
        maxWidth: 800, margin: '0 auto 2.5rem',
        padding: '36pt 48pt',
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: 4,
        boxShadow: '0 4px 28px rgba(0,0,0,0.10)',
        ...doc,
      }}>

        {/* University Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src="/crawford-logo.png"
            alt="Crawford University Logo"
            style={{ height: 80, width: 'auto', display: 'block', margin: '0 auto 8px' }}
          />
          <div style={{ fontSize: '15pt', fontWeight: 'bold', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            CRAWFORD UNIVERSITY
          </div>
          <div style={{ fontSize: '10pt', color: '#444', marginTop: '2px', letterSpacing: '0.03em' }}>
            Faith and Knowledge · Igbesa, Ogun State, Nigeria
          </div>
          <div style={{
            fontSize: '13pt', fontWeight: 'bold', marginTop: '12px',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '5px 0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000',
          }}>
            CURRICULUM VITAE
          </div>
          <div style={{ fontSize: '9pt', marginTop: '4px', color: '#555', fontStyle: 'italic' }}>
            Academic Staff {isAcademic ? 'Promotion' : 'Performance'} Appraisal — {cycleYear} Cycle
          </div>
        </div>

        {/* Items 1–16: Personal Details */}
        {personalDetails.map(([label, value], i) =>
          value ? (
            <div key={i} style={{ display: 'flex', marginBottom: '4px', pageBreakInside: 'avoid' }}>
              <span style={{ fontWeight: 'bold', minWidth: '48%', flexShrink: 0, paddingRight: '6px' }}>
                {i + 1}. {label}:
              </span>
              <span>{value}</span>
            </div>
          ) : null
        )}

        {/* 17. Educational Institutions */}
        <div style={secTitle}>17. EDUCATIONAL INSTITUTIONS ATTENDED WITH DATES</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '18%' }}>DATES</th>
              <th style={th}>INSTITUTION</th>
            </tr>
          </thead>
          <tbody>
            {p.qualifyingInstitution ? (
              <tr>
                <td style={td}>{p.yearAwarded || '—'}</td>
                <td style={td}>{p.qualifyingInstitution}</td>
              </tr>
            ) : (
              <tr><td colSpan={2} style={{ ...td, color: '#666' }}>Not provided</td></tr>
            )}
            {p.qualifyingBody && (
              <tr>
                <td style={td}>{p.professionalYear || '—'}</td>
                <td style={td}>{p.qualifyingBody}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 18. Academic Qualifications */}
        <div style={secTitle}>18. ACADEMIC QUALIFICATIONS WITH DATES</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '12%' }}>YEAR</th>
              <th style={{ ...th, width: '38%' }}>QUALIFICATION</th>
              <th style={th}>INSTITUTION / BODY</th>
            </tr>
          </thead>
          <tbody>
            {p.highestQualification ? (
              <tr>
                <td style={td}>{p.yearAwarded || '—'}</td>
                <td style={td}>{p.highestQualification}</td>
                <td style={td}>{p.qualifyingInstitution || '—'}</td>
              </tr>
            ) : (
              <tr><td colSpan={3} style={{ ...td, color: '#666' }}>Not provided</td></tr>
            )}
            {p.professionalQualification && (
              <tr>
                <td style={td}>{p.professionalYear || '—'}</td>
                <td style={td}>{p.professionalQualification}</td>
                <td style={td}>{p.qualifyingBody || '—'}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 19. Honours & Memberships */}
        {isAcademic && Array.isArray(p.professionalBodies) && p.professionalBodies.some(b => b.name) && (
          <>
            <div style={secTitle}>19. HONOURS, DISTINCTIONS AND MEMBERSHIP OF LEARNED PROFESSIONAL BODIES/SOCIETIES</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>BODY / SOCIETY</th>
                  <th style={{ ...th, width: '26%' }}>MEMBERSHIP TYPE</th>
                  <th style={{ ...th, width: '10%', textAlign: 'center' }}>YEAR</th>
                </tr>
              </thead>
              <tbody>
                {p.professionalBodies.filter(b => b.name).map((b, i) => (
                  <tr key={i}>
                    <td style={td}>{b.name}</td>
                    <td style={td}>{b.type || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{b.year || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* 20. Work Experience */}
        <div style={secTitle}>20. WORK EXPERIENCES WITH DATES</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '28%' }}>DATES</th>
              <th style={th}>POSITION / INSTITUTION</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}>{p.dateFirstAppointed || p.dateOfFirstAppointment || '—'} – Date</td>
              <td style={td}>
                {rank}{department ? `, Dept. of ${department}` : ''}, Crawford University, Igbesa, Ogun State
              </td>
            </tr>
          </tbody>
        </table>

        {/* 21. Publications */}
        {publications.length > 0 && (
          <>
            <div style={secTitle}>21. PUBLICATIONS ({publications.length} total)</div>

            {journals.length > 0 && (
              <>
                <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '10.5pt', marginBottom: '4px' }}>
                  A. Peer-Reviewed Journal Articles ({journals.length})
                </div>
                <ol style={{ paddingLeft: '20px', margin: '0 0 10px', fontSize: '10.5pt', lineHeight: 1.75 }}>
                  {journals.map((pub, i) => (
                    <li key={i} style={{ marginBottom: '3px' }}>
                      {fullName} ({pub.year_of_publication}). {pub.title}. <em>{pub.journal_name}</em>
                      {pub.isbn_issn ? `. ISSN: ${pub.isbn_issn}` : ''}.
                    </li>
                  ))}
                </ol>
              </>
            )}

            {books.length > 0 && (
              <>
                <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '10.5pt', marginBottom: '4px' }}>
                  B. Books ({books.length})
                </div>
                <ol style={{ paddingLeft: '20px', margin: '0 0 10px', fontSize: '10.5pt', lineHeight: 1.75 }}>
                  {books.map((pub, i) => (
                    <li key={i} style={{ marginBottom: '3px' }}>
                      {fullName} ({pub.year_of_publication}). <em>{pub.title}</em>. {pub.publisher || pub.journal_name}
                      {pub.isbn_issn ? `. ISBN: ${pub.isbn_issn}` : ''}.
                    </li>
                  ))}
                </ol>
              </>
            )}

            {chapters.length > 0 && (
              <>
                <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '10.5pt', marginBottom: '4px' }}>
                  C. Book Chapters ({chapters.length})
                </div>
                <ol style={{ paddingLeft: '20px', margin: '0 0 10px', fontSize: '10.5pt', lineHeight: 1.75 }}>
                  {chapters.map((pub, i) => (
                    <li key={i} style={{ marginBottom: '3px' }}>
                      {fullName} ({pub.year_of_publication}). {pub.title}. In: {pub.journal_name || pub.publisher}.
                    </li>
                  ))}
                </ol>
              </>
            )}

            {conferences.length > 0 && (
              <>
                <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '10.5pt', marginBottom: '4px' }}>
                  D. Conference Proceedings ({conferences.length})
                </div>
                <ol style={{ paddingLeft: '20px', margin: '0 0 10px', fontSize: '10.5pt', lineHeight: 1.75 }}>
                  {conferences.map((pub, i) => (
                    <li key={i} style={{ marginBottom: '3px' }}>
                      {fullName} ({pub.year_of_publication}). {pub.title}. {pub.journal_name || pub.publisher}.
                    </li>
                  ))}
                </ol>
              </>
            )}

            {otherPubs.length > 0 && (
              <>
                <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '10.5pt', marginBottom: '4px' }}>
                  E. Other Publications ({otherPubs.length})
                </div>
                <ol style={{ paddingLeft: '20px', margin: '0 0 10px', fontSize: '10.5pt', lineHeight: 1.75 }}>
                  {otherPubs.map((pub, i) => (
                    <li key={i} style={{ marginBottom: '3px' }}>
                      {fullName} ({pub.year_of_publication}). {pub.title}. {pub.journal_name || pub.publisher}.
                    </li>
                  ))}
                </ol>
              </>
            )}
          </>
        )}

        {/* 22. Courses Taught */}
        {isAcademic && Array.isArray(p.coursesTaught) && p.coursesTaught.some(c => c.code) && (
          <>
            <div style={secTitle}>22. COURSES TAUGHT</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: '14%' }}>CODE</th>
                  <th style={th}>COURSE TITLE</th>
                  <th style={{ ...th, width: '14%', textAlign: 'center' }}>LEVEL</th>
                  <th style={{ ...th, width: '10%', textAlign: 'center' }}>UNITS</th>
                </tr>
              </thead>
              <tbody>
                {p.coursesTaught.filter(c => c.code).map((c, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 'bold' }}>{c.code}</td>
                    <td style={td}>{c.title}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{c.level || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{c.units || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* 23. PG Supervision */}
        {isAcademic && Array.isArray(p.pgSupervision) && p.pgSupervision.some(s => s.studentName) && (
          <>
            <div style={secTitle}>23. POSTGRADUATE SUPERVISION</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: '26%' }}>STUDENT NAME</th>
                  <th style={{ ...th, width: '10%' }}>LEVEL</th>
                  <th style={th}>THESIS TITLE</th>
                  <th style={{ ...th, width: '14%', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {p.pgSupervision.filter(s => s.studentName).map((s, i) => (
                  <tr key={i}>
                    <td style={td}>{s.studentName}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{s.level}</td>
                    <td style={td}>{s.thesisTitle}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* 24. Admin Responsibilities */}
        {isAcademic && p.adminResponsibilities && (
          <>
            <div style={secTitle}>24. ADMINISTRATIVE RESPONSIBILITIES</div>
            <p style={{ margin: '0 0 4px', lineHeight: 1.7, fontSize: '10.5pt', whiteSpace: 'pre-line' }}>{p.adminResponsibilities}</p>
          </>
        )}

        {/* 25. Community Service */}
        {isAcademic && p.communityService && (
          <>
            <div style={secTitle}>25. COMMUNITY SERVICE / EXTENSION ACTIVITIES</div>
            <p style={{ margin: '0 0 4px', lineHeight: 1.7, fontSize: '10.5pt', whiteSpace: 'pre-line' }}>{p.communityService}</p>
          </>
        )}

        {/* 26. Research Interests */}
        {isAcademic && p.researchInterests && (
          <>
            <div style={secTitle}>26. RESEARCH INTERESTS</div>
            <p style={{ margin: '0 0 4px', lineHeight: 1.7, fontSize: '10.5pt' }}>{p.researchInterests}</p>
          </>
        )}

        {/* 27. Research Profiles */}
        {isAcademic && (p.orcid || p.googleScholar || p.scopus || p.researchgate || p.academia) && (
          <>
            <div style={secTitle}>27. RESEARCH PROFILES / ONLINE PRESENCE</div>
            {p.orcid        && <div style={{ fontSize: '10.5pt', marginBottom: '3px' }}><strong>ORCID:</strong> {'https://orcid.org/' + p.orcid}</div>}
            {p.googleScholar && <div style={{ fontSize: '10.5pt', marginBottom: '3px' }}><strong>Google Scholar:</strong> {p.googleScholar}</div>}
            {p.scopus       && <div style={{ fontSize: '10.5pt', marginBottom: '3px' }}><strong>Scopus:</strong> {p.scopus}</div>}
            {p.researchgate && <div style={{ fontSize: '10.5pt', marginBottom: '3px' }}><strong>ResearchGate:</strong> {p.researchgate}</div>}
            {p.academia     && <div style={{ fontSize: '10.5pt', marginBottom: '3px' }}><strong>Academia.edu:</strong> {p.academia}</div>}
            {Array.isArray(p.otherLinks) && p.otherLinks.filter(l => l.label && l.url).map((l, i) => (
              <div key={i} style={{ fontSize: '10.5pt', marginBottom: '3px' }}><strong>{l.label}:</strong> {l.url}</div>
            ))}
          </>
        )}

        {/* Non-teaching sections */}
        {!isAcademic && p.duties && (
          <>
            <div style={secTitle}>17. ROLES AND RESPONSIBILITIES</div>
            <p style={{ margin: '0 0 4px', lineHeight: 1.7, fontSize: '10.5pt', whiteSpace: 'pre-line' }}>{p.duties}</p>
          </>
        )}
        {!isAcademic && p.achievements && (
          <>
            <div style={secTitle}>18. ACHIEVEMENTS</div>
            <p style={{ margin: '0 0 4px', lineHeight: 1.7, fontSize: '10.5pt', whiteSpace: 'pre-line' }}>{p.achievements}</p>
          </>
        )}
        {!isAcademic && Array.isArray(p.training) && p.training.some(t => t.title) && (
          <>
            <div style={secTitle}>19. TRAINING AND PROFESSIONAL DEVELOPMENT</div>
            {p.training.filter(t => t.title).map((t, i) => (
              <div key={i} style={{ marginBottom: '4px', fontSize: '10.5pt' }}>
                <strong>{t.title}</strong>{t.organizer ? ` — ${t.organizer}` : ''}{t.date ? ` (${t.date})` : ''}{t.duration ? `, ${t.duration}` : ''}
              </div>
            ))}
          </>
        )}
        {!isAcademic && p.professionalBodies && (
          <>
            <div style={secTitle}>20. PROFESSIONAL MEMBERSHIPS</div>
            <p style={{ margin: '0 0 4px', lineHeight: 1.7, fontSize: '10.5pt' }}>{p.professionalBodies}</p>
          </>
        )}

        {/* Signature Section */}
        <div style={{ marginTop: '3rem', pageBreakInside: 'avoid' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
            <div>
              <div style={{ borderTop: '1px solid #000', marginTop: '3.5rem', paddingTop: '5px', fontSize: '10.5pt' }}>
                Signature of Applicant
              </div>
              <div style={{ marginTop: '4px', fontWeight: 'bold' }}>{fullName}</div>
              <div style={{ fontSize: '10.5pt' }}>Date: {today}</div>
            </div>
            <div>
              <div style={{ borderTop: '1px solid #000', marginTop: '3.5rem', paddingTop: '5px', fontSize: '10.5pt' }}>
                Signature &amp; Stamp of Head of Department
              </div>
              <div style={{ marginTop: '4px', fontSize: '10.5pt' }}>Date: _______________</div>
            </div>
          </div>
          <div style={{
            textAlign: 'center', marginTop: '2rem', fontSize: '8.5pt', color: '#666',
            borderTop: '1px solid #ddd', paddingTop: '6px',
          }}>
            Crawford University, Igbesa, Ogun State{staffId ? ` · Staff ID: ${staffId}` : ''} · Generated: {today}
          </div>
        </div>

      </div>
    </>
  );
};

export default StaffOfficialCVPage;
