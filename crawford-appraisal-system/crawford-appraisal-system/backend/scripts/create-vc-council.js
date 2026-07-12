require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../src/config/db');

const USERS = [
  {
    email: 'vc@crawforduniversity.edu.ng',
    password: 'Crawford@VC2026',
    full_name: 'Vice Chancellor',
    role: 'vc',
    staff_id: 'CU/VC/001',
    department: 'Office of the Vice Chancellor',
    college: 'University Administration',
    current_rank: 'Vice Chancellor',
    staff_category: 'academic',
  },
  {
    email: 'council@crawforduniversity.edu.ng',
    password: 'Crawford@Council2026',
    full_name: 'University Council',
    role: 'council',
    staff_id: 'CU/COUNCIL/001',
    department: 'University Council',
    college: 'University Governance',
    current_rank: 'Council Member',
    staff_category: null,
  },
];

async function createUser({ email, password, full_name, role, staff_id, department, college, current_rank, staff_category }) {
  console.log(`\nCreating ${role} — ${email}...`);

  const existing = await db('users').select('id').where({ email }).first();
  if (existing) {
    console.log(`  ⚠  Already exists — skipping.`);
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);

  await db('users').insert({
    id: uuidv4(),
    email,
    full_name,
    password_hash,
    role,
    staff_id: staff_id || null,
    department: department || null,
    college: college || null,
    current_rank: current_rank || null,
    staff_category: staff_category || null,
    is_active: true,
  });

  console.log(`  ✓  Created successfully.`);
  console.log(`     Email   : ${email}`);
  console.log(`     Password: ${password}`);
  console.log(`     Role    : ${role}`);
}

(async () => {
  console.log('Crawford University — Creating VC & Council accounts\n');
  for (const user of USERS) {
    await createUser(user).catch(err => console.error(`  ✗  ${err.message}`));
  }
  console.log('\nDone.');
  process.exit(0);
})();
