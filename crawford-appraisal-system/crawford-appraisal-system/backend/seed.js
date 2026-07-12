// Fresh demo/test data seed for the self-hosted Postgres database.
// Run this ONCE against a database that already has database/standalone-schema.sql
// applied. It WIPES all rows in these tables first — do not run against real data.
//
//   node seed.js
//
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('./src/config/db');

const PASSWORD = 'Demo@123';

async function main() {
  console.log('Seeding demo data...\n');

  // Wipe in FK-safe order (children before parents)
  await db('notifications').del();
  await db('audit_logs').del();
  await db('external_assessors').del();
  await db('promotions').del();
  await db('publications').del();
  await db('appraisals').del();
  await db('meeting_minutes').del();
  await db('appraisal_deadlines').del();
  await db('departments').del();
  await db('users').del();

  const password_hash = await bcrypt.hash(PASSWORD, 10);
  const id = () => uuidv4();

  const reportingOfficerId = id();

  const users = [
    { id: id(), email: 'admin@crawford.edu.ng', full_name: 'System Administrator', staff_id: 'CU/ADM/001', role: 'admin', staff_category: null, department: 'ICT Services', college: 'Central Administration', current_rank: null },
    { id: id(), email: 'hr@crawford.edu.ng', full_name: 'Mrs. Folake Adeleke', staff_id: 'CU/HR/001', role: 'hr_personnel', staff_category: null, department: 'Human Resources', college: 'Central Administration', current_rank: null },
    { id: id(), email: 'vc@crawford.edu.ng', full_name: 'Prof. Samuel Adeyemi', staff_id: 'CU/VC/001', role: 'vc', staff_category: 'academic', department: 'Office of the Vice Chancellor', college: 'Central Administration', current_rank: 'Professor' },
    { id: id(), email: 'registry@crawford.edu.ng', full_name: 'Mr. Emeka Okafor', staff_id: 'CU/REG/001', role: 'registry', staff_category: null, department: 'Registry', college: 'Central Administration', current_rank: null },
    { id: id(), email: 'dean.conas@crawford.edu.ng', full_name: 'Prof. Adaeze Chukwu', staff_id: 'CU/DEAN/001', role: 'dean', staff_category: 'academic', department: 'Dean\'s Office', college: 'College of Natural and Applied Sciences (CONAS)', current_rank: 'Professor' },
    { id: id(), email: 'hod.cs@crawford.edu.ng', full_name: 'Dr. Chukwuemeka Nwosu', staff_id: 'CU/HOD/001', role: 'hod', staff_category: 'academic', department: 'Computer Science', college: 'College of Natural and Applied Sciences (CONAS)', current_rank: 'Senior Lecturer' },
    { id: id(), email: 'hod.micro@crawford.edu.ng', full_name: 'Dr. Ngozi Obi', staff_id: 'CU/HOD/002', role: 'hod', staff_category: 'academic', department: 'Microbiology', college: 'College of Natural and Applied Sciences (CONAS)', current_rank: 'Senior Lecturer' },
    { id: id(), email: 'b.eze@crawford.edu.ng', full_name: 'Dr. Blessing Eze', staff_id: 'CU/STF/001', role: 'staff', staff_category: 'academic', department: 'Computer Science', college: 'College of Natural and Applied Sciences (CONAS)', current_rank: 'Lecturer I' },
    { id: id(), email: 'c.nwachukwu@crawford.edu.ng', full_name: 'Mrs. Chioma Nwachukwu', staff_id: 'CU/STF/003', role: 'staff', staff_category: 'academic', department: 'Microbiology', college: 'College of Natural and Applied Sciences (CONAS)', current_rank: 'Lecturer II' },
    { id: id(), email: 'assocprof.demo@crawford.edu.ng', full_name: 'Dr. Funmilayo Okonkwo', staff_id: 'CU/STF/010', role: 'staff', staff_category: 'academic', department: 'Computer Science', college: 'College of Natural and Applied Sciences (CONAS)', current_rank: 'Senior Lecturer' },
    { id: reportingOfficerId, email: 'reportingofficer@crawford.edu.ng', full_name: 'Mr. Tunde Bakare', staff_id: 'CU/RO/001', role: 'reporting_officer', staff_category: 'senior_nonteaching', department: 'Registry', college: 'Central Administration', current_rank: 'Senior Executive Officer' },
    { id: id(), email: 'a.obiora@crawford.edu.ng', full_name: 'Miss Amaka Obiora', staff_id: 'CU/STF/004', role: 'staff', staff_category: 'junior_nonteaching', department: 'Registry', college: 'Central Administration', current_rank: 'Senior Clerical Officer', reporting_officer_id: reportingOfficerId },
    { id: id(), email: 'b.fashola@crawford.edu.ng', full_name: 'Mr. Bola Fashola', staff_id: 'CU/STF/005', role: 'staff', staff_category: 'senior_nonteaching', department: 'Bursary', college: 'Central Administration', current_rank: 'Senior Executive Officer', reporting_officer_id: reportingOfficerId },
    { id: id(), email: 'apc@crawford.edu.ng', full_name: 'Prof. Rotimi Adegoke', staff_id: 'CU/APC/001', role: 'a&pc', staff_category: null, department: 'A&PC', college: 'Central Administration', current_rank: null },
    { id: id(), email: 'apc.academic@crawford.edu.ng', full_name: 'APC Academic Committee', staff_id: 'APC/ACAD/001', role: 'apc_academic', staff_category: null, department: 'A&PC', college: 'Central Administration', current_rank: null },
    { id: id(), email: 'apc.junior@crawford.edu.ng', full_name: 'APC Junior Non-Teaching Committee', staff_id: 'APC/JNT/001', role: 'apc_junior', staff_category: null, department: 'A&PC', college: 'Central Administration', current_rank: null },
    { id: id(), email: 'apc.senior@crawford.edu.ng', full_name: 'APC Senior Non-Teaching Committee', staff_id: 'APC/SNT/001', role: 'apc_senior', staff_category: null, department: 'A&PC', college: 'Central Administration', current_rank: null },
    { id: id(), email: 'collegeboard@crawford.edu.ng', full_name: 'College Board Member', staff_id: 'CU/CB/001', role: 'college_board', staff_category: null, department: 'College Board', college: 'College of Natural and Applied Sciences (CONAS)', current_rank: null },
  ];

  await db('users').insert(users.map(u => ({
    ...u,
    password_hash,
    is_active: true,
  })));

  await db('appraisal_deadlines').insert({
    id: id(),
    appraisal_year: '2025/2026',
    staff_submission_deadline: '2026-06-20',
    hod_assessment_deadline: '2026-06-30',
    college_board_review_deadline: '2026-07-10',
    apc_review_deadline: '2026-07-20',
    is_active: true,
  });

  console.log(`Created ${users.length} demo accounts. All passwords: ${PASSWORD}\n`);
  users.forEach(u => console.log(`  ${u.email.padEnd(32)} [${u.role}]`));

  console.log('\nDone.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
