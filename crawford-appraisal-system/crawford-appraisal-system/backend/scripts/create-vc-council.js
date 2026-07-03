require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { supabase } = require('../src/config/supabase');

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

  // Check if email already exists in the users table
  const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) {
    console.log(`  ⚠  Already exists — skipping.`);
    return;
  }

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
      console.log(`  ⚠  Auth user already exists — skipping.`);
      return;
    }
    throw new Error(`Auth error: ${authError.message}`);
  }

  // Insert profile
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    full_name,
    role,
    staff_id: staff_id || null,
    department: department || null,
    college: college || null,
    current_rank: current_rank || null,
    staff_category: staff_category || null,
    is_active: true,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
    throw new Error(`Profile error: ${profileError.message}`);
  }

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
