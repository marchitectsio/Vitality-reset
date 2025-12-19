/**
 * Reset Demo User Script
 * 
 * This script deletes a user and their related data by email address.
 * 
 * Usage:
 *   npx tsx scripts/resetDemoUser.ts marti@gmail.com
 * 
 * This will delete:
 *   - The user record
 *   - Associated user_roles
 *   - Associated user_programs
 */

import { Pool } from 'pg';

const email = process.argv[2];

if (!email) {
  console.error('\n❌ Error: Please provide an email address\n');
  console.log('Usage: npx tsx scripts/resetDemoUser.ts <email>');
  console.log('Example: npx tsx scripts/resetDemoUser.ts marti@gmail.com\n');
  process.exit(1);
}

async function resetUser(targetEmail: string) {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('\n❌ Error: DATABASE_URL environment variable not set\n');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log(`\n🔍 Looking for user: ${targetEmail}`);
    
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [targetEmail]
    );

    if (userResult.rows.length === 0) {
      console.log(`\n⚠️  No user found with email: ${targetEmail}`);
      console.log('   The user may not exist or was already deleted.\n');
      return;
    }

    const user = userResult.rows[0];
    console.log(`   Found user: ${user.name} (ID: ${user.id})`);

    console.log('\n🗑️  Deleting related data...');

    const rolesResult = await pool.query(
      'DELETE FROM user_roles WHERE user_id = $1 RETURNING *',
      [user.id]
    );
    console.log(`   - Deleted ${rolesResult.rowCount} role(s)`);

    const programsResult = await pool.query(
      'DELETE FROM user_programs WHERE user_id = $1 RETURNING *',
      [user.id]
    );
    console.log(`   - Deleted ${programsResult.rowCount} program enrollment(s)`);

    const journalResult = await pool.query(
      'DELETE FROM journal_entries WHERE user_id = $1 RETURNING *',
      [user.id]
    );
    console.log(`   - Deleted ${journalResult.rowCount} journal entry(ies)`);

    const checkinsResult = await pool.query(
      'DELETE FROM check_ins WHERE user_id = $1 RETURNING *',
      [user.id]
    );
    console.log(`   - Deleted ${checkinsResult.rowCount} check-in(s)`);

    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    console.log(`   - Deleted user record`);

    console.log(`\n✅ Successfully reset user: ${targetEmail}`);
    console.log('   They can now sign up again with a fresh account.\n');

  } catch (error) {
    console.error('\n❌ Error resetting user:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetUser(email);
