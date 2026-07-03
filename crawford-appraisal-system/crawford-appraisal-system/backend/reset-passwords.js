require('dotenv').config();
const { supabase } = require('./src/config/supabase');

// Reset ALL demo account passwords back to Demo@123
async function main() {
  const { data: users, error } = await supabase.from('users').select('id, email, full_name, role');
  if (error) { console.error('Could not fetch users:', error.message); process.exit(1); }

  console.log(`Found ${users.length} users — resetting all passwords to Demo@123\n`);

  for (const user of users) {
    const { error: resetErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'Demo@123',
    });
    if (resetErr) {
      console.log(`FAIL  ${user.email.padEnd(42)} [${user.role}] — ${resetErr.message}`);
    } else {
      console.log(`OK    ${user.email.padEnd(42)} [${user.role}]`);
    }
  }

  console.log('\nDone. All accounts should now accept password: Demo@123');
}

main().catch(console.error);
