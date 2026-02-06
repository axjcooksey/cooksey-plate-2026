#!/usr/bin/env ts-node
/**
 * Rollback Test Data Script
 * Cleans up all test tips and resets Round 0 to original state
 * 
 * Usage:
 *   npm run rollback-test     # Remove all Round 0 tips and reset times
 *   npm run rollback-test -- --confirm  # Skip confirmation prompt
 */

import Database from '../src/db/database';
import * as readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database();

async function askConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('⚠️  This will DELETE all Round 0 tips. Continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function rollback() {
  try {
    await db.connect();
    
    console.log('🔙 Rollback Test Data Script\n');

    // Check if --confirm flag is present
    const confirmed = process.argv.includes('--confirm') || await askConfirmation();

    if (!confirmed) {
      console.log('❌ Rollback cancelled');
      process.exit(0);
    }

    console.log('\n🗑️  Starting rollback...\n');

    // 1. Delete all Round 0 tips
    const tipsResult = await db.run(`DELETE FROM tips WHERE round_id = 3`);
    console.log(`✓ Deleted ${tipsResult.changes || 0} tips from Round 0`);

    // 2. Reset game times to original Squiggle values
    await db.run(`
      UPDATE squiggle_games 
      SET date = CASE squiggle_game_key
        WHEN '001' THEN '2026-03-05 19:30:00'
        WHEN '002' THEN '2026-03-06 19:05:00'
        WHEN '003' THEN '2026-03-07 16:15:00'
        WHEN '004' THEN '2026-03-07 18:35:00'
        WHEN '005' THEN '2026-03-08 19:20:00'
      END,
      complete = 0,
      winner = NULL,
      hscore = 0,
      ascore = 0
      WHERE squiggle_game_key IN ('001', '002', '003', '004', '005')
    `);
    console.log('✓ Reset game times to original Squiggle values');

    // 3. Reset games table
    await db.run(`
      UPDATE games 
      SET start_time = CASE id
        WHEN 1 THEN '2026-03-05T08:30:00.000Z'
        WHEN 2 THEN '2026-03-06T09:05:00.000Z'
        WHEN 3 THEN '2026-03-07T05:15:00.000Z'
        WHEN 4 THEN '2026-03-07T08:35:00.000Z'
        WHEN 5 THEN '2026-03-08T08:20:00.000Z'
      END,
      is_complete = 0,
      home_score = 0,
      away_score = 0
      WHERE id IN (1, 2, 3, 4, 5)
    `);
    console.log('✓ Reset games table');

    // 4. Reset round status
    await db.run(`
      UPDATE rounds 
      SET status = 'upcoming',
          lockout_time = '2026-03-05T08:30:00.000Z'
      WHERE id = 3
    `);
    console.log('✓ Reset round status to upcoming');

    // 5. Verify cleanup
    const remainingTips = await db.get(`SELECT COUNT(*) as count FROM tips WHERE round_id = 3`);
    const roundInfo = await db.get(`
      SELECT round_number, year, status, lockout_time 
      FROM rounds 
      WHERE id = 3
    `);

    console.log('\n📊 Verification:');
    console.log(`   Tips remaining: ${remainingTips.count}`);
    console.log(`   Round status: ${roundInfo.status}`);
    console.log(`   Lockout time: ${roundInfo.lockout_time}`);

    if (remainingTips.count === 0) {
      console.log('\n✅ Rollback complete! Round 0 is clean and ready for testing.');
    } else {
      console.log('\n⚠️  Warning: Some tips still remain in database');
    }

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

rollback();
