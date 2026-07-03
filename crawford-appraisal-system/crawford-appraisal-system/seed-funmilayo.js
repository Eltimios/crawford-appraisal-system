require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function seed() {
  // Get Dean and HOD IDs
  const { data: dean } = await supabase.from('users').select('id').eq('role', 'dean').single();
  const { data: hod }  = await supabase.from('users').select('id').eq('staff_id', 'CU/HOD/001').single();

  const STAFF_ID = '1a9a63b9-fd07-4c05-a0a0-9efa9e5976c4';
  const DEAN_ID  = dean?.id;
  const HOD_ID   = hod?.id;

  console.log('Dean ID :', DEAN_ID);
  console.log('HOD ID  :', HOD_ID);

  // ── 1. Update user biodata fields ──────────────────────────────────────────
  const { error: uErr } = await supabase.from('users').update({
    date_of_first_appointment: '2010-09-01',
    date_of_last_promotion:    '2020-09-01',
  }).eq('id', STAFF_ID);
  console.log('User update         :', uErr ? uErr.message : 'OK');

  // ── 2. Publications ────────────────────────────────────────────────────────
  const pubs = [
    {
      staff_id: STAFF_ID,
      title: 'A Survey of Deep Learning Techniques for Medical Image Analysis',
      journal: 'Journal of Medical Informatics',
      year: 2024, type: 'journal',
      doi: '10.1016/j.jmi.2024.001',
    },
    {
      staff_id: STAFF_ID,
      title: 'Blockchain-Enabled Secure Healthcare Data Management in Developing Nations',
      journal: 'International Journal of Computer Science and Information Security',
      year: 2023, type: 'journal',
      doi: '10.1007/ijcsis.2023.045',
    },
    {
      staff_id: STAFF_ID,
      title: 'Artificial Intelligence in Education: A Systematic Literature Review',
      journal: 'Proceedings of IEEE EDUCON 2023',
      year: 2023, type: 'conference',
      doi: '10.1109/EDUCON.2023.099',
    },
    {
      staff_id: STAFF_ID,
      title: 'Explainable Artificial Intelligence: Challenges, Opportunities and Applications',
      journal: 'IEEE Transactions on Neural Networks and Learning Systems',
      year: 2022, type: 'journal',
      doi: '10.1109/tnnls.2022.3187',
    },
    {
      staff_id: STAFF_ID,
      title: 'Credit Risk Assessment Using Ensemble Machine Learning Models',
      journal: 'Journal of Finance and Technology',
      year: 2021, type: 'journal',
      doi: '10.1080/jft.2021.0234',
    },
    {
      staff_id: STAFF_ID,
      title: 'Adaptive E-Learning Systems in Nigerian Universities: A Review',
      journal: 'African Journal of Educational Technology',
      year: 2020, type: 'journal',
      doi: '10.4314/ajet.2020.012',
    },
    {
      staff_id: STAFF_ID,
      title: 'Automated Academic Timetabling Using Genetic Algorithms',
      journal: 'Journal of Computing in Education Research',
      year: 2019, type: 'journal',
      doi: '10.1080/jcer.2019.0098',
    },
  ];

  const { error: pubErr } = await supabase.from('publications').insert(pubs);
  console.log('Publications        :', pubErr ? pubErr.message : pubs.length + ' added');

  // ── 3. Full appraisal ──────────────────────────────────────────────────────
  const part1 = {
    sex: 'Female',
    rank: 'Associate Professor',
    college: 'College of Natural and Applied Sciences',
    staffId: 'CU/STF/010',
    surname: 'Okonkwo',
    firstName: 'Funmilayo',
    otherNames: 'Adaeze',
    otherInfo: '',
    department: 'Computer Science',
    periodFrom: '2025-09-01',
    periodTo:   '2026-08-31',
    conferences: 'IEEE International Conference on AI, Dubai 2024; ACM SIGCSE, Portland 2023; AICTED Conference, Lagos 2022',
    dateOfBirth: '1975-03-15',
    lgaOfOrigin: 'Abeokuta South',
    nationality: 'Nigerian',
    maritalStatus: 'Married',
    stateOfOrigin: 'Ogun State',
    highestQualification: 'Ph.D',
    qualifyingInstitution: 'University of Lagos',
    yearAwarded: '2008',
    qualifyingBody: 'CPN',
    professionalQualification: 'Certified Computer Professional (CCP), 2008',
    professionalYear: '2008',
    dateOfFirstAppointment: '2010-09-01',
    dateOfCurrentRank: '2020-09-01',
    coursesTaught: [
      { code: 'CSC 501', level: '500', title: 'Advanced Database Systems',        units: '3', students: '35' },
      { code: 'CSC 401', level: '400', title: 'Artificial Intelligence',           units: '3', students: '60' },
      { code: 'CSC 301', level: '300', title: 'Data Structures and Algorithms',   units: '3', students: '80' },
    ],
    pgSupervision: [
      { level: 'Ph.D', status: 'In Progress', studentName: 'Emeka Obi',    thesisTitle: 'Deep Learning for Medical Diagnosis in Low-Resource Settings' },
      { level: 'Ph.D', status: 'Completed',   studentName: 'Taiwo Lawal',  thesisTitle: 'Neural Network Approaches to NLP in Yoruba Language' },
      { level: 'M.Sc', status: 'Completed',   studentName: 'Aisha Mohammed', thesisTitle: 'Blockchain in Healthcare Records Management' },
    ],
    ugSupervision: [
      { status: 'Completed',   studentName: 'Tunde Adeyemi',  projectTitle: 'Smart Campus App Using IoT' },
      { status: 'Completed',   studentName: 'Grace Nwosu',    projectTitle: 'Face Recognition Attendance System' },
      { status: 'In Progress', studentName: 'Blessing Okoro', projectTitle: 'AI-based Exam Timetabling System' },
    ],
    ongoingResearch: [
      { title: 'Machine Learning for Credit Risk Assessment in Rural Banks', status: 'In Progress', funding: 'TETFund Research Grant', collaborators: 'Dr. A. Ibrahim (ABU), Prof. K. Ojo (UNILAG)' },
      { title: 'Explainable AI in Healthcare Systems',                       status: 'Completed',   funding: 'NRSA Grant',            collaborators: 'Dr. Ngozi Obi (Crawford University)' },
    ],
    communityService: 'Member, Local Government Education Committee, Igbesa (2022-Present); ICT Trainer for Secondary School Teachers, Ogun State SUBEB (2021); Free Coding Bootcamp Organizer for Indigent Youth, Igbesa Community (2023)',
    professionalBodies: [
      { name: 'Computer Professionals Registration Council of Nigeria (CPN)', type: 'Full Member',   year: '2008' },
      { name: 'Nigerian Computer Society (NCS)',                              type: 'Fellow',         year: '2015' },
      { name: 'IEEE',                                                         type: 'Senior Member',  year: '2018' },
      { name: 'Association for Computing Machinery (ACM)',                    type: 'Member',         year: '2016' },
    ],
    adminResponsibilities: 'Postgraduate Coordinator, Department of Computer Science (2022-Present); Member, Faculty Research and Publications Committee (2021-Present); Examination Officer, College of Natural and Applied Sciences (2019-2021)',
  };

  const hodGrades = {
    research:                        { grade: 'A' },
    qualityOfTeaching:               { grade: 'A' },
    serviceToProfession:             { grade: 'A' },
    contributionToCountry:           { grade: 'B' },
    contributionToUniversity:        { grade: 'A' },
    departmentResponsibilities:      { grade: 'A' },
    otherDepartmentResponsibilities: { grade: 'B' },
    overallGrade: 'A',
  };

  const { data: appraisal, error: apErr } = await supabase.from('appraisals').insert({
    staff_id:             STAFF_ID,
    appraisal_year:       '2025/2026',
    staff_category:       'academic',
    status:               'college_board_reviewed',
    part1_data:           part1,
    part1_locked:         true,
    part1_submitted_at:   '2026-03-10T09:00:00Z',
    hod_id:               HOD_ID,
    hod_grades:           hodGrades,
    hod_recommendation:   'Dr. Funmilayo Okonkwo has demonstrated exceptional academic performance across teaching, research, and community service. With 7 publications, 3 postgraduate students supervised, active TETFund research grants, and strong administrative contributions, she fully meets all criteria for promotion to Full Professor. I strongly recommend her without reservation.',
    hod_assessed_at:      '2026-03-20T10:00:00Z',
    staff_action:         'validated',
    staff_action_at:      '2026-03-22T11:00:00Z',
    college_board_recommendation: 'promote',
    college_board_notes:  'The College Board unanimously endorses this recommendation. Dr. Okonkwo has clearly demonstrated the academic, research, and community standards required for promotion to Full Professor. Her publication record in reputable journals, postgraduate supervision output, TETFund-funded research, and administrative dedication are commendable. The Board recommends she be forwarded to A&PC for final consideration.',
    college_board_reviewed_by:  DEAN_ID,
    college_board_reviewed_at:  '2026-04-05T09:00:00Z',
    college_board_status:       'reviewed',
    pfq_established:            false,
    interview_completed:        false,
  }).select().single();

  if (apErr) {
    console.error('Appraisal error     :', apErr.message);
  } else {
    console.log('Appraisal created   :', appraisal.id);
    console.log('Status              :', appraisal.status);
  }

  console.log('\nDone. Dr. Funmilayo Okonkwo is ready for demo.');
}

seed().catch(console.error);
