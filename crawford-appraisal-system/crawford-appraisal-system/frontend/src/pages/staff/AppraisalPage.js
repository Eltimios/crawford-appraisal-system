import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyAppraisal, createAppraisal, saveDraft, submitAppraisal } from '../../services/appraisalService';
import api from '../../services/api';
import { NON_TEACHING_CADRES, CADRE_NAMES } from '../../data/nonTeachingCadres';

const COLLEGES = [
  'College of Natural Sciences',
  'College of Social and Management Sciences',
  'College of Engineering and Technology',
  'College of Law',
  'College of Humanities',
];

const DEPARTMENTS_BY_COLLEGE = {
  'College of Natural Sciences': [
    'Computer Science, ICT & Cybersecurity',
    'Microbiology',
    'Industrial Chemistry',
    'Geology',
    'Biochemistry',
    'Physics',
  ],
  'College of Social and Management Sciences': [
    'Business Administration',
    'Accounting',
    'Economics',
    'Mass Communication',
    'Sociology',
    'Political Science',
  ],
  'College of Engineering and Technology': [
    'Electrical & Electronics Engineering',
    'Civil Engineering',
    'Mechanical Engineering',
    'Computer Engineering',
  ],
  'College of Law': ['Law'],
  'College of Humanities': [
    'English & Literary Studies',
    'History & International Studies',
    'Religious Studies',
    'Philosophy',
  ],
};

const ALL_DEPARTMENTS = Object.values(DEPARTMENTS_BY_COLLEGE).flat();

const NON_TEACHING_DEPARTMENTS = [
  'Administration',
  'Registry',
  'Bursary & Finance',
  'Library Services',
  'Student Affairs',
  'Works & Maintenance',
  'ICT Services',
  'Security Services',
  'Health Services',
  'Procurement & Stores',
  'Human Resources',
  'Public Relations & Information',
  'Legal Services',
  'Examinations & Records',
];

// ─── Initial data factories ───────────────────────────────────────────────────

const emptyRow = (fields) => fields.reduce((acc, f) => ({ ...acc, [f]: '' }), {});

const initAcademic = () => ({
  surname: '', firstName: '', otherNames: '',
  dateOfBirth: '', sex: '', maritalStatus: '', nationality: 'Nigerian',
  stateOfOrigin: '', lgaOfOrigin: '',
  staffId: '', college: '', department: '',
  rank: '', dateOfFirstAppointment: '', dateOfCurrentRank: '',
  periodFrom: '2025-09-01', periodTo: '2026-08-31',
  highestQualification: '', qualifyingInstitution: '', yearAwarded: '',
  professionalQualification: '', qualifyingBody: '', professionalYear: '',
  coursesTaught: [emptyRow(['code', 'title', 'units', 'students', 'level'])],
  ongoingResearch: [emptyRow(['title', 'collaborators', 'funding', 'status'])],
  pgSupervision: [emptyRow(['studentName', 'level', 'thesisTitle', 'status'])],
  ugSupervision: [emptyRow(['studentName', 'projectTitle', 'status'])],
  communityService: '',
  professionalBodies: [emptyRow(['name', 'type', 'year'])],
  conferences: '',
  adminResponsibilities: '',
  otherInfo: '',
  // Biodata & Profile
  phone: '', officeRoomNumber: '',
  linkedIn: '', orcid: '', scopus: '', researchgate: '', googleScholar: '', academia: '',
  otherLinks: [emptyRow(['label', 'url'])],
  visitingHours: '', researchInterests: '', personalStatement: '',
});

const initJunior = () => ({
  surname: '', firstName: '', otherNames: '',
  dateOfBirth: '', sex: '', maritalStatus: '', nationality: 'Nigerian',
  stateOfOrigin: '', lgaOfOrigin: '',
  staffId: '', department: '', unit: '',
  cadre: '', designation: '', gradeLevel: '', step: '',
  dateOfFirstAppointment: '', dateOfPresentGrade: '',
  periodFrom: '2025-09-01', periodTo: '2026-08-31',
  highestQualification: '', qualifyingInstitution: '', yearAwarded: '',
  duties: '', achievements: '', challenges: '',
  training: [emptyRow(['title', 'organizer', 'date', 'duration'])],
  professionalBodies: '',
  otherInfo: '',
  // Biodata & Profile
  phone: '', linkedIn: '', personalStatement: '',
});

const initSenior = () => ({
  ...initJunior(),
  staffSupervised: '',
  supervisoryDuties: '',
});

const initByCategory = (cat) => {
  if (cat === 'academic') return initAcademic();
  if (cat === 'senior_nonteaching') return initSenior();
  return initJunior();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Field = ({ label, children, required }) => (
  <div className="form-group">
    <label className="form-label">{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
    {children}
  </div>
);

const Input = ({ value, onChange, type = 'text', placeholder, disabled }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className="form-input"
  />
);

const Select = ({ value, onChange, options, placeholder, disabled }) => (
  <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className="form-input">
    <option value="">{placeholder || 'Select...'}</option>
    {options.map(o => (
      <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
    ))}
  </select>
);

const Textarea = ({ value, onChange, placeholder, rows = 4, disabled }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    disabled={disabled}
    className="form-input"
    style={{ resize: 'vertical' }}
  />
);

const SectionTitle = ({ children }) => (
  <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
    {children}
  </h3>
);

const DynamicTable = ({ rows, columns, onAdd, onRemove, onUpdate, locked, addLabel }) => (
  <div>
    <div style={{ overflowX: 'auto' }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr) 36px`, gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
          {columns.map(col => (
            <input
              key={col.key}
              type={col.type || 'text'}
              placeholder={col.label}
              value={row[col.key] || ''}
              onChange={e => onUpdate(i, col.key, e.target.value)}
              disabled={locked}
              className="form-input"
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            />
          ))}
          {!locked && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              disabled={rows.length === 1}
              style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
                opacity: rows.length === 1 ? 0.4 : 1, fontSize: '1rem', flexShrink: 0,
              }}
            >×</button>
          )}
        </div>
      ))}
    </div>
    {!locked && (
      <button type="button" onClick={onAdd} className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
        + {addLabel || 'Add Row'}
      </button>
    )}
  </div>
);

// ─── Section renderers ────────────────────────────────────────────────────────

const PersonalSection = ({ data, update, locked, category }) => {
  const isAcademic = category === 'academic';
  const isSenior = category === 'senior_nonteaching';

  return (
    <div>
      <SectionTitle>A. Personal Information</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1.25rem' }}>
        <Field label="Surname" required><Input value={data.surname} onChange={v => update('surname', v)} disabled={locked} /></Field>
        <Field label="First Name" required><Input value={data.firstName} onChange={v => update('firstName', v)} disabled={locked} /></Field>
        <Field label="Other Names"><Input value={data.otherNames} onChange={v => update('otherNames', v)} disabled={locked} /></Field>
        <Field label="Date of Birth" required>
          <Input type="date" value={data.dateOfBirth} onChange={v => update('dateOfBirth', v)} disabled={locked} />
        </Field>
        <Field label="Sex" required>
          <Select value={data.sex} onChange={v => update('sex', v)} disabled={locked}
            options={['Male', 'Female']} placeholder="Select sex" />
        </Field>
        <Field label="Marital Status">
          <Select value={data.maritalStatus} onChange={v => update('maritalStatus', v)} disabled={locked}
            options={['Single', 'Married', 'Divorced', 'Widowed']} placeholder="Select status" />
        </Field>
        <Field label="Nationality"><Input value={data.nationality} onChange={v => update('nationality', v)} disabled={locked} /></Field>
        <Field label="State of Origin"><Input value={data.stateOfOrigin} onChange={v => update('stateOfOrigin', v)} disabled={locked} /></Field>
        <Field label="LGA of Origin"><Input value={data.lgaOfOrigin} onChange={v => update('lgaOfOrigin', v)} disabled={locked} /></Field>
      </div>

      <SectionTitle style={{ marginTop: '1.5rem' }}>B. Staff Information</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1.25rem' }}>
        <Field label="Staff ID / Number" required><Input value={data.staffId} onChange={v => update('staffId', v)} disabled={locked} /></Field>

        {isAcademic ? (
          <>
            <Field label="College" required>
              <Select
                value={data.college}
                onChange={v => { update('college', v); update('department', ''); }}
                options={COLLEGES}
                placeholder="Select college"
                disabled={locked}
              />
            </Field>
            <Field label="Department" required>
              <Select
                value={data.department}
                onChange={v => update('department', v)}
                options={data.college ? (DEPARTMENTS_BY_COLLEGE[data.college] || []) : ALL_DEPARTMENTS}
                placeholder="Select department"
                disabled={locked}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Department" required>
              <Select
                value={data.department}
                onChange={v => update('department', v)}
                options={NON_TEACHING_DEPARTMENTS}
                placeholder="Select department"
                disabled={locked}
              />
            </Field>
            <Field label="Unit / Section">
              <Input value={data.unit} onChange={v => update('unit', v)} disabled={locked} />
            </Field>
          </>
        )}

        {isAcademic ? (
          <Field label="Rank / Designation" required>
            <Select value={data.rank} onChange={v => update('rank', v)} disabled={locked}
              options={['Graduate Assistant', 'Assistant Lecturer', 'Lecturer II', 'Lecturer I', 'Senior Lecturer', 'Associate Professor', 'Professor']}
              placeholder="Select rank" />
          </Field>
        ) : (
          <>
            <Field label="Cadre" required>
              <Select value={data.cadre} onChange={v => { update('cadre', v); update('designation', ''); }} disabled={locked}
                options={CADRE_NAMES} placeholder="Select cadre" />
            </Field>
            <Field label="Designation / Job Title" required>
              <Select value={data.designation} onChange={v => update('designation', v)} disabled={locked || !data.cadre}
                options={data.cadre ? NON_TEACHING_CADRES[data.cadre] : []}
                placeholder={data.cadre ? 'Select designation' : 'Select cadre first'} />
            </Field>
            <Field label="Grade Level (HATISS)">
              <Select value={data.gradeLevel} onChange={v => update('gradeLevel', v)} disabled={locked}
                options={Array.from({ length: 15 }, (_, i) => `GL ${i + 1}`)} placeholder="Select grade" />
            </Field>
            <Field label="Step"><Input value={data.step} onChange={v => update('step', v)} placeholder="e.g. 1" disabled={locked} /></Field>
            {isSenior && (
              <Field label="No. of Staff Supervised">
                <Input value={data.staffSupervised} onChange={v => update('staffSupervised', v)} placeholder="e.g. 5" disabled={locked} />
              </Field>
            )}
          </>
        )}

        <Field label="Date of First Appointment">
          <Input type="date" value={data.dateOfFirstAppointment} onChange={v => update('dateOfFirstAppointment', v)} disabled={locked} />
        </Field>
        <Field label={isAcademic ? 'Date of Present Rank' : 'Date of Present Grade'}>
          <Input type="date" value={isAcademic ? data.dateOfCurrentRank : data.dateOfPresentGrade}
            onChange={v => update(isAcademic ? 'dateOfCurrentRank' : 'dateOfPresentGrade', v)} disabled={locked} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }}>
        <Field label="Appraisal Period — From">
          <Input type="date" value={data.periodFrom} onChange={v => update('periodFrom', v)} disabled={locked} />
        </Field>
        <Field label="Appraisal Period — To">
          <Input type="date" value={data.periodTo} onChange={v => update('periodTo', v)} disabled={locked} />
        </Field>
      </div>

      <SectionTitle style={{ marginTop: '1.5rem' }}>C. Qualifications</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1.25rem' }}>
        <Field label="Highest Academic Qualification" required>
          <Select value={data.highestQualification} onChange={v => update('highestQualification', v)} disabled={locked}
            options={['SSCE / WAEC', 'OND / NCE', 'HND', 'B.Sc / B.A / B.Ed', 'PGDE / PGD', 'M.Sc / M.A / M.Ed', 'PhD / DPhil', 'Other']}
            placeholder="Select qualification" />
        </Field>
        <Field label="Awarding Institution" required>
          <Input value={data.qualifyingInstitution} onChange={v => update('qualifyingInstitution', v)} disabled={locked} />
        </Field>
        <Field label="Year Awarded" required>
          <Input value={data.yearAwarded} onChange={v => update('yearAwarded', v)} placeholder="e.g. 2018" disabled={locked} />
        </Field>
        {isAcademic && (
          <>
            <Field label="Professional Qualification (if any)">
              <Input value={data.professionalQualification} onChange={v => update('professionalQualification', v)} disabled={locked} />
            </Field>
            <Field label="Awarding Body">
              <Input value={data.qualifyingBody} onChange={v => update('qualifyingBody', v)} disabled={locked} />
            </Field>
            <Field label="Year">
              <Input value={data.professionalYear} onChange={v => update('professionalYear', v)} disabled={locked} />
            </Field>
          </>
        )}
      </div>

      {isSenior && (
        <>
          <SectionTitle style={{ marginTop: '1.5rem' }}>D. Supervisory Responsibilities</SectionTitle>
          <Field label="Names and Designations of Staff Under Your Supervision">
            <Textarea value={data.supervisoryDuties} onChange={v => update('supervisoryDuties', v)}
              placeholder="List staff members you supervise with their designations..." disabled={locked} />
          </Field>
        </>
      )}
    </div>
  );
};

const TeachingSection = ({ data, update, updateRow, addRow, removeRow, locked, year }) => (
  <div>
    <SectionTitle>Teaching Activities — {year}</SectionTitle>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
      List all courses you taught during the appraisal period. Include both undergraduate and postgraduate courses.
    </p>
    <div style={{ marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) 36px', gap: '0.5rem' }}>
      {['Course Code', 'Course Title', 'Credit Units', 'No. of Students', 'Level (e.g. 200)'].map(h => (
        <div key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
      ))}
    </div>
    <DynamicTable
      rows={data.coursesTaught}
      columns={[
        { key: 'code', label: 'e.g. CSC 301' },
        { key: 'title', label: 'Course Title' },
        { key: 'units', label: 'e.g. 3' },
        { key: 'students', label: 'e.g. 45' },
        { key: 'level', label: 'e.g. 300' },
      ]}
      onAdd={() => addRow('coursesTaught', emptyRow(['code', 'title', 'units', 'students', 'level']))}
      onRemove={i => removeRow('coursesTaught', i)}
      onUpdate={(i, k, v) => updateRow('coursesTaught', i, k, v)}
      locked={locked}
      addLabel="Add Course"
    />
  </div>
);

const ResearchSection = ({ data, update, updateRow, addRow, removeRow, locked }) => (
  <div>
    <SectionTitle>Research Activities & Supervision</SectionTitle>

    <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
      
      <span>Upload your publications separately using the <strong>Publications</strong> module in the sidebar. Publications are scored automatically.</span>
    </div>

    <h4 style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      Ongoing Research Projects
    </h4>
    <div style={{ marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 36px', gap: '0.5rem' }}>
      {['Title', 'Collaborators', 'Funding Source', 'Status'].map(h => (
        <div key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
      ))}
    </div>
    <DynamicTable
      rows={data.ongoingResearch}
      columns={[
        { key: 'title', label: 'Research Title' },
        { key: 'collaborators', label: 'Collaborator(s)' },
        { key: 'funding', label: 'Funding Source' },
        { key: 'status', label: 'Ongoing / Completed' },
      ]}
      onAdd={() => addRow('ongoingResearch', emptyRow(['title', 'collaborators', 'funding', 'status']))}
      onRemove={i => removeRow('ongoingResearch', i)}
      onUpdate={(i, k, v) => updateRow('ongoingResearch', i, k, v)}
      locked={locked}
      addLabel="Add Research"
    />

    <div style={{ marginTop: '1.75rem' }}>
      <h4 style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Postgraduate Student Supervision
      </h4>
      <div style={{ marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 36px', gap: '0.5rem' }}>
        {['Student Name', 'Level', 'Thesis/Dissertation Title', 'Status'].map(h => (
          <div key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
        ))}
      </div>
      <DynamicTable
        rows={data.pgSupervision}
        columns={[
          { key: 'studentName', label: 'Student Name' },
          { key: 'level', label: 'PhD / M.Sc / PGD' },
          { key: 'thesisTitle', label: 'Thesis Title' },
          { key: 'status', label: 'In Progress / Completed' },
        ]}
        onAdd={() => addRow('pgSupervision', emptyRow(['studentName', 'level', 'thesisTitle', 'status']))}
        onRemove={i => removeRow('pgSupervision', i)}
        onUpdate={(i, k, v) => updateRow('pgSupervision', i, k, v)}
        locked={locked}
        addLabel="Add Student"
      />
    </div>

    <div style={{ marginTop: '1.75rem' }}>
      <h4 style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Undergraduate Project Supervision
      </h4>
      <div style={{ marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 36px', gap: '0.5rem' }}>
        {['Student Name', 'Project Title', 'Status'].map(h => (
          <div key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
        ))}
      </div>
      <DynamicTable
        rows={data.ugSupervision}
        columns={[
          { key: 'studentName', label: 'Student Name' },
          { key: 'projectTitle', label: 'Project Title' },
          { key: 'status', label: 'In Progress / Completed' },
        ]}
        onAdd={() => addRow('ugSupervision', emptyRow(['studentName', 'projectTitle', 'status']))}
        onRemove={i => removeRow('ugSupervision', i)}
        onUpdate={(i, k, v) => updateRow('ugSupervision', i, k, v)}
        locked={locked}
        addLabel="Add Student"
      />
    </div>
  </div>
);

const OtherActivitiesSection = ({ data, update, updateRow, addRow, removeRow, locked }) => (
  <div>
    <SectionTitle>Other Activities</SectionTitle>

    <Field label="Community Service Activities">
      <Textarea value={data.communityService} onChange={v => update('communityService', v)}
        placeholder="Describe community service activities carried out during the appraisal period..."
        disabled={locked} />
    </Field>

    <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
      <label className="form-label">Professional Body Memberships</label>
      <div style={{ marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 36px', gap: '0.5rem' }}>
        {['Body Name', 'Membership Type', 'Year Joined'].map(h => (
          <div key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
        ))}
      </div>
      <DynamicTable
        rows={data.professionalBodies}
        columns={[
          { key: 'name', label: 'e.g. NCS, CPN, NSE' },
          { key: 'type', label: 'Fellow / Member / Associate' },
          { key: 'year', label: 'e.g. 2020' },
        ]}
        onAdd={() => addRow('professionalBodies', emptyRow(['name', 'type', 'year']))}
        onRemove={i => removeRow('professionalBodies', i)}
        onUpdate={(i, k, v) => updateRow('professionalBodies', i, k, v)}
        locked={locked}
        addLabel="Add Body"
      />
    </div>

    <Field label="Conferences / Workshops Attended">
      <Textarea value={data.conferences} onChange={v => update('conferences', v)}
        placeholder="List conferences, seminars, and workshops attended with dates and locations..."
        disabled={locked} />
    </Field>

    <Field label="Administrative Responsibilities">
      <Textarea value={data.adminResponsibilities} onChange={v => update('adminResponsibilities', v)}
        placeholder="List committee memberships, administrative positions held (with period)..."
        disabled={locked} />
    </Field>

    <Field label="Any Other Relevant Information">
      <Textarea value={data.otherInfo} onChange={v => update('otherInfo', v)}
        placeholder="Any other information relevant to your appraisal..."
        disabled={locked} rows={3} />
    </Field>
  </div>
);

const JobDescriptionSection = ({ data, update, updateRow, addRow, removeRow, locked, category }) => (
  <div>
    <SectionTitle>Job Description & Activities</SectionTitle>

    {category === 'senior_nonteaching' && (
      <Field label="Supervisory Duties Performed">
        <Textarea value={data.supervisoryDuties} onChange={v => update('supervisoryDuties', v)}
          placeholder="Describe your supervisory duties and the staff you supervise..."
          disabled={locked} />
      </Field>
    )}

    <Field label="Main Duties / Responsibilities" required>
      <Textarea value={data.duties} onChange={v => update('duties', v)}
        placeholder="Describe your primary duties and responsibilities during the appraisal period..."
        rows={5} disabled={locked} />
    </Field>

    <Field label="Major Achievements">
      <Textarea value={data.achievements} onChange={v => update('achievements', v)}
        placeholder="List your major achievements during the appraisal period..."
        disabled={locked} />
    </Field>

    <Field label="Challenges Encountered">
      <Textarea value={data.challenges} onChange={v => update('challenges', v)}
        placeholder="Describe any significant challenges encountered during the period..."
        disabled={locked} />
    </Field>

    <div style={{ marginTop: '1.25rem' }}>
      <label className="form-label">Training / Courses Attended</label>
      <div style={{ marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 36px', gap: '0.5rem' }}>
        {['Course / Training Title', 'Organizer', 'Date', 'Duration'].map(h => (
          <div key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
        ))}
      </div>
      <DynamicTable
        rows={data.training}
        columns={[
          { key: 'title', label: 'Training Title' },
          { key: 'organizer', label: 'Organizer' },
          { key: 'date', label: 'e.g. Jan 2026', type: 'text' },
          { key: 'duration', label: 'e.g. 3 days' },
        ]}
        onAdd={() => addRow('training', emptyRow(['title', 'organizer', 'date', 'duration']))}
        onRemove={i => removeRow('training', i)}
        onUpdate={(i, k, v) => updateRow('training', i, k, v)}
        locked={locked}
        addLabel="Add Training"
      />
    </div>
  </div>
);

const OtherInfoSection = ({ data, update, locked }) => (
  <div>
    <SectionTitle>Professional Development & Other Information</SectionTitle>
    <Field label="Professional Body Memberships">
      <Textarea value={data.professionalBodies} onChange={v => update('professionalBodies', v)}
        placeholder="List any professional bodies you belong to (name, type, year joined)..."
        disabled={locked} />
    </Field>
    <Field label="Any Other Relevant Information">
      <Textarea value={data.otherInfo} onChange={v => update('otherInfo', v)}
        placeholder="Any other information you wish to bring to the attention of the appraisal committee..."
        disabled={locked} rows={5} />
    </Field>
  </div>
);

const BiodataSection = ({ data, update, locked, category }) => {
  const isAcademic = category === 'academic';
  return (
    <div>
      <SectionTitle>Biodata &amp; Profile</SectionTitle>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        This section builds your staff profile page and downloadable CV. All fields are optional and can be updated even after appraisal submission.
      </p>

      <SectionTitle style={{ marginTop: 0 }}>Contact Details</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }}>
        <Field label="Phone Number">
          <Input value={data.phone || ''} onChange={v => update('phone', v)} placeholder="+234 803 000 0000" disabled={locked} />
        </Field>
        {isAcademic && (
          <Field label="Office / Room Number">
            <Input value={data.officeRoomNumber || ''} onChange={v => update('officeRoomNumber', v)} placeholder="e.g. Block A, Room 204" disabled={locked} />
          </Field>
        )}
        {!isAcademic && (
          <Field label="LinkedIn Profile URL">
            <Input value={data.linkedIn || ''} onChange={v => update('linkedIn', v)} placeholder="https://linkedin.com/in/..." disabled={locked} />
          </Field>
        )}
      </div>

      {isAcademic && (
        <>
          <SectionTitle style={{ marginTop: '1.5rem' }}>Research Profile Links</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }}>
            <Field label="ORCID ID">
              <Input value={data.orcid || ''} onChange={v => update('orcid', v)} placeholder="0000-0002-1234-5678" disabled={locked} />
            </Field>
            <Field label="Google Scholar URL">
              <Input value={data.googleScholar || ''} onChange={v => update('googleScholar', v)} placeholder="https://scholar.google.com/..." disabled={locked} />
            </Field>
            <Field label="Scopus Profile URL">
              <Input value={data.scopus || ''} onChange={v => update('scopus', v)} placeholder="https://www.scopus.com/..." disabled={locked} />
            </Field>
            <Field label="ResearchGate URL">
              <Input value={data.researchgate || ''} onChange={v => update('researchgate', v)} placeholder="https://researchgate.net/..." disabled={locked} />
            </Field>
            <Field label="Academia.edu URL">
              <Input value={data.academia || ''} onChange={v => update('academia', v)} placeholder="https://independent.academia.edu/..." disabled={locked} />
            </Field>
            <Field label="LinkedIn Profile URL">
              <Input value={data.linkedIn || ''} onChange={v => update('linkedIn', v)} placeholder="https://linkedin.com/in/..." disabled={locked} />
            </Field>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Other Links
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              Add any other professional profiles or pages (e.g. Personal Website, GitHub, YouTube Channel, Twitter/X, etc.)
            </p>
            <div style={{ marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr) 36px', gap: '0.5rem' }}>
              {['Label', 'URL'].map(h => (
                <div key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            <DynamicTable
              rows={data.otherLinks || []}
              columns={[
                { key: 'label', label: 'e.g. Personal Website, GitHub…' },
                { key: 'url', label: 'https://…' },
              ]}
              onAdd={() => addRow('otherLinks', emptyRow(['label', 'url']))}
              onRemove={i => removeRow('otherLinks', i)}
              onUpdate={(i, k, v) => updateRow('otherLinks', i, k, v)}
              locked={locked}
              addLabel="+ Add Link"
            />
          </div>

          <SectionTitle style={{ marginTop: '1.5rem' }}>Academic Profile</SectionTitle>
          <Field label="Research Interest Areas">
            <Textarea value={data.researchInterests || ''} onChange={v => update('researchInterests', v)}
              placeholder="e.g. Machine Learning, Cybersecurity, Cloud Computing (separate with commas)"
              rows={3} disabled={locked} />
          </Field>
          <Field label="Office / Visiting Hours">
            <Input value={data.visitingHours || ''} onChange={v => update('visitingHours', v)}
              placeholder="e.g. Monday &amp; Wednesday 10:00am – 12:00pm" disabled={locked} />
          </Field>
        </>
      )}

      <SectionTitle style={{ marginTop: '1.5rem' }}>Personal Statement</SectionTitle>
      <Field label="Brief Professional Statement">
        <Textarea value={data.personalStatement || ''} onChange={v => update('personalStatement', v)}
          placeholder="Write a brief professional statement — your background, expertise, and contributions to the university and community..."
          rows={6} disabled={locked} />
      </Field>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const AppraisalPage = () => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const category = userProfile?.staff_category || 'junior_nonteaching';
  const isAcademic = category === 'academic';

  const sections = isAcademic
    ? ['Personal Information', 'Teaching Activities', 'Research & Supervision', 'Other Activities', 'Biodata & Profile']
    : ['Personal Information', 'Job Description', 'Other Information', 'Biodata & Profile'];

  const [cycleYear, setCycleYear] = useState('2025/2026');
  const [activeSection, setActiveSection] = useState(location.state?.section ?? 0);
  const [formData, setFormData] = useState(() => initByCategory(category));
  const [appraisalId, setAppraisalId] = useState(null);
  const [status, setStatus] = useState('new');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingBiodata, setSavingBiodata] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadError, setLoadError] = useState('');

  const isLocked = status === 'submitted';

  // Fetch current cycle year only
  useEffect(() => {
    api.get('/settings/cycle-status')
      .then(res => setCycleYear(res.data.current_year || '2025/2026'))
      .catch(() => {});
  }, []);

  // Load existing appraisal on mount
  useEffect(() => {
    if (!userProfile || !cycleYear) return;
    (async () => {
      try {
        const existing = await getMyAppraisal(userProfile.id, cycleYear);
        if (existing) {
          setAppraisalId(existing.id);
          setStatus(existing.status);
          if (existing.part1) setFormData({ ...initByCategory(category), ...existing.part1 });
        } else {
          // Pre-fill from user profile for a fresh form
          setFormData(prev => ({
            ...prev,
            staffId:    userProfile.staff_id    || '',
            department: userProfile.department  || '',
            ...(category === 'academic' ? { college: userProfile.college || '' } : {}),
          }));
        }
      } catch {
        setLoadError('Could not load existing appraisal. Check your connection.');
      }
    })();
  }, [userProfile, cycleYear]);

  const update = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateRow = useCallback((field, index, key, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((row, i) => i === index ? { ...row, [key]: value } : row),
    }));
  }, []);

  const addRow = useCallback((field, emptyRowObj) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], emptyRowObj] }));
  }, []);

  const removeRow = useCallback((field, index) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  }, []);

  const handleSaveDraft = async () => {
    if (!userProfile) return;
    setSaving(true);
    setSaveMessage('');
    try {
      let id = appraisalId;
      if (!id) {
        // Returns existing ID if frontend lost state (crash recovery)
        id = await createAppraisal(userProfile.id, category, cycleYear, formData);
        setAppraisalId(id);
        setStatus('draft');
      }
      await saveDraft(id, formData);
      setSaveMessage('Draft saved successfully.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!userProfile) return;
    setSubmitting(true);
    try {
      let id = appraisalId;
      if (!id) {
        // createAppraisal returns existing ID if frontend lost state after crash
        id = await createAppraisal(userProfile.id, category, cycleYear, formData);
        setAppraisalId(id);
      }
      // Always save latest form data before submitting
      await saveDraft(id, formData);
      await submitAppraisal(id);
      setStatus('submitted');
      setShowConfirm(false);
    } catch (err) {
      const msg = err?.response?.data?.error || '';
      if (msg.toLowerCase().includes('locked') || msg.toLowerCase().includes('only draft')) {
        setSaveMessage('This appraisal has already been submitted.');
        setStatus('submitted');
      } else {
        setSaveMessage('Submission failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBiodata = async () => {
    setSavingBiodata(true);
    setSaveMessage('');
    try {
      const biodataPayload = {
        phone: formData.phone,
        personalStatement: formData.personalStatement,
        linkedIn: formData.linkedIn,
        ...(isAcademic && {
          officeRoomNumber: formData.officeRoomNumber,
          orcid: formData.orcid,
          scopus: formData.scopus,
          researchgate: formData.researchgate,
          googleScholar: formData.googleScholar,
          academia: formData.academia,
          otherLinks: formData.otherLinks,
          visitingHours: formData.visitingHours,
          researchInterests: formData.researchInterests,
        }),
      };
      await api.put('/appraisals/my/biodata', biodataPayload);
      setSaveMessage('Profile saved successfully.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveMessage('Failed to save profile. Please try again.');
    } finally {
      setSavingBiodata(false);
    }
  };

  const sharedProps = { data: formData, update, updateRow, addRow, removeRow, locked: isLocked, category, year: cycleYear };

  const renderSection = () => {
    if (isAcademic) {
      switch (activeSection) {
        case 0: return <PersonalSection {...sharedProps} />;
        case 1: return <TeachingSection {...sharedProps} />;
        case 2: return <ResearchSection {...sharedProps} />;
        case 3: return <OtherActivitiesSection {...sharedProps} />;
        case 4: return <BiodataSection {...sharedProps} locked={false} />;
        default: return null;
      }
    } else {
      switch (activeSection) {
        case 0: return <PersonalSection {...sharedProps} />;
        case 1: return <JobDescriptionSection {...sharedProps} />;
        case 2: return <OtherInfoSection {...sharedProps} />;
        case 3: return <BiodataSection {...sharedProps} locked={false} />;
        default: return null;
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Annual Appraisal Form</h1>
            <p className="page-subtitle">
              {isAcademic ? 'Academic Staff APER' : category === 'senior_nonteaching' ? 'Senior Non-Teaching Staff' : 'Junior Non-Teaching Staff'} — {cycleYear}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isLocked
              ? <span className="badge badge-success">Submitted</span>
              : status === 'draft'
                ? <span className="badge badge-warning">Draft Saved</span>
                : <span className="badge badge-secondary">⬜ Not Started</span>
            }
          </div>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <span>{loadError}</span>
        </div>
      )}

      {isLocked && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <span>Your appraisal has been submitted and is now locked. Your {isAcademic ? 'HOD/HOU' : 'Reporting Officer'} will be notified to complete your assessment.</span>
        </div>
      )}

      {/* Section progress tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', overflowX: 'auto', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {sections.map((sec, i) => (
          <button
            key={i}
            onClick={() => setActiveSection(i)}
            style={{
              padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeSection === i ? 'var(--primary-light)' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeSection === i ? 'var(--primary-light)' : 'transparent'}`,
              whiteSpace: 'nowrap', transition: 'all 0.2s ease',
            }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700,
              marginRight: '0.5rem',
              background: activeSection === i ? 'rgba(59,130,246,0.15)' : 'var(--bg-hover)',
              color: activeSection === i ? 'var(--primary-light)' : 'var(--text-muted)',
            }}>{i + 1}</span>
            {sec}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="progress-bar" style={{ marginBottom: '2rem' }}>
        <div className="progress-fill" style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }} />
      </div>

      {/* Form section content */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {renderSection()}
      </div>

      {/* Bottom navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => setActiveSection(s => Math.max(0, s - 1))}
          disabled={activeSection === 0}
          className="btn btn-secondary"
        >
          ← Previous
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {saveMessage && (
            <span style={{ fontSize: '0.875rem', color: saveMessage.includes('Failed') ? '#f87171' : '#34d399' }}>
              {saveMessage}
            </span>
          )}

          {!isLocked && (
            <button onClick={handleSaveDraft} disabled={saving} className="btn btn-secondary">
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          )}

          {isLocked && activeSection === sections.length - 1 && (
            <button onClick={handleSaveBiodata} disabled={savingBiodata} className="btn btn-secondary">
              {savingBiodata ? 'Saving...' : 'Save Profile'}
            </button>
          )}

          {activeSection < sections.length - 1 ? (
            <button onClick={() => setActiveSection(s => s + 1)} className="btn btn-primary">
              Next →
            </button>
          ) : (
            !isLocked && (
              <button onClick={() => setShowConfirm(true)} className="btn btn-success">
                Submit Appraisal
              </button>
            )
          )}
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Confirm Submission</h3>
              <button onClick={() => setShowConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem' }}>×</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Are you sure you want to submit your appraisal form?
            </p>
            <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
              
              <span>Once submitted, <strong>Part 1 (your information) will be locked</strong> and cannot be edited. Your {isAcademic ? 'HOD/HOU' : 'Reporting Officer'} will be notified to begin your assessment.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn btn-success">
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppraisalPage;
