require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { supabase } = require('../src/config/supabase');

const COUNCIL_EMAIL    = 'council@crawforduniversity.edu.ng';
const COUNCIL_PASSWORD = 'Crawford@Council2026';
const COUNCIL_STAFF_ID = 'CU/COUNCIL/001';

async function run() {
  // ── Council account ────────────────────────────────────────────────────────
  console.log('Creating Council user...');

  const { data: existing } = await supabase.from('users').select('id').eq('role', 'council').maybeSingle();
  if (existing) {
    console.log('  Council user already exists.');
    printSummary();
    return;
  }

  // Check staff_id conflict
  const { data: idCheck } = await supabase.from('users').select('id').eq('staff_id', COUNCIL_STAFF_ID).maybeSingle();
  const staffId = idCheck ? `CU/COUNCIL/00${Date.now().toString().slice(-2)}` : COUNCIL_STAFF_ID;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: COUNCIL_EMAIL,
    password: COUNCIL_PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
      // Auth user exists but no profile — get their ID
      console.log('  Auth user found but no profile — attempting profile insert...');
      const { data: { users: allAuthUsers } } = await supabase.auth.admin.listUsers();
      const councilAuth = (allAuthUsers || []).find(u => u.email === COUNCIL_EMAIL);
      if (!councilAuth) { console.error('  Could not find auth user.'); return; }
      await insertProfile(councilAuth.id, staffId);
    } else {
      console.error('  Auth error:', authError.message);
    }
    return;
  }

  await insertProfile(authData.user.id, staffId);
}

async function insertProfile(authId, staffId) {
  const { error } = await supabase.from('users').insert({
    id: authId,
    email: COUNCIL_EMAIL,
    full_name: 'University Council',
    role: 'council',
    staff_id: staffId,
    department: 'University Council',
    college: 'University Governance',
    current_rank: null,
    staff_category: null,
    is_active: true,
  });

  if (error) {
    await supabase.auth.admin.deleteUser(authId).catch(() => {});
    if (error.message.includes('role_check') || error.message.includes('check constraint')) {
      console.error('\n  ✗  BLOCKED: The users_role_check constraint does not include "council".');
      console.error('     Run the SQL below in Supabase, then re-run this script.\n');
    } else if (error.message.includes('staff_id') && error.message.includes('not-null')) {
      console.error('\n  ✗  BLOCKED: staff_id column is NOT NULL but null was provided.');
      console.error('     Run the SQL below in Supabase to allow nullable staff_id, then re-run.\n');
    } else {
      console.error('\n  ✗  Profile error:', error.message, '\n');
    }
    printRequiredSQL();
  } else {
    console.log('  ✓  Council account created successfully.\n');
    printSummary();
  }
}

function printRequiredSQL() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  REQUIRED: Run this SQL in Supabase → SQL Editor');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('-- 1. Allow nullable staff_id (VC/Council may not have one)');
  console.log('ALTER TABLE users ALTER COLUMN staff_id DROP NOT NULL;');
  console.log('');
  console.log('-- 2. Add council to role check constraint');
  console.log('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
  console.log("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (");
  console.log("  'staff','hod','hou','reporting_officer','dean','vc',");
  console.log("  'registry','hr_personnel','a&pc','apc_academic','apc_junior',");
  console.log("  'apc_senior','college_board','council','admin'");
  console.log("));");
  console.log('');
  console.log('-- 3. Add council_decision column (if not done yet)');
  console.log('ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS council_decision JSONB;');
  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  After running the SQL, run: node scripts/fix-constraint-create-council.js');
  console.log('══════════════════════════════════════════════════════════════\n');
}

function printSummary() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  LOGIN CREDENTIALS');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  Vice Chancellor');
  console.log('  Email   : vc@crawford.edu.ng');
  console.log('  Password: Crawford@VC2026');
  console.log('  Portal  : http://localhost:3000/vc');
  console.log('');
  console.log('  University Council');
  console.log('  Email   : council@crawforduniversity.edu.ng');
  console.log('  Password: Crawford@Council2026');
  console.log('  Portal  : http://localhost:3000/council');
  console.log('══════════════════════════════════════════════════════════════\n');
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
