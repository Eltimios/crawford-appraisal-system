require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('./src/config/db');

// Reset ALL demo account passwords back to Demo@123
async function main() {
  const users = await db('users').select('id', 'email', 'full_name', 'role');

  console.log(`Found ${users.length} users — resetting all passwords to Demo@123\n`);

  const password_hash = await bcrypt.hash('Demo@123', 10);

  for (const user of users) {
    try {
      await db('users').where({ id: user.id }).update({ password_hash });
      console.log(`OK    ${user.email.padEnd(42)} [${user.role}]`);
    } catch (err) {
      console.log(`FAIL  ${user.email.padEnd(42)} [${user.role}] — ${err.message}`);
    }
  }

  console.log('\nDone. All accounts should now accept password: Demo@123');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
