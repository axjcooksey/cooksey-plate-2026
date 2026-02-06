#!/usr/bin/env ts-node
/**
 * Quick Status Checker
 * Shows current Round 0 status, tip counts, and game info
 */

import Database from '../src/db/database';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database();

async function checkStatus() {
  try {
    await db.connect();
    
    console.log('📊 Round 0 Status Check\n');
    console.log('═'.repeat(60));

    // Round info
    const round = await db.get(`
      SELECT id, round_number, year, status, lockout_time 
      FROM rounds 
      WHERE round_number = 0 AND year = 2026
    `);

    const now = new Date();
    const lockout = new Date(round.lockout_time);
    const isLocked = now > lockout;

    console.log('\n🏈 ROUND INFORMATION');
    console.log(`   Round: ${round.round_number} (${round.year})`);
    console.log(`   Status: ${round.status.toUpperCase()}`);
    console.log(`   Lockout: ${lockout.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
    console.log(`   Current: ${now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
    console.log(`   ${isLocked ? '🔒 LOCKED' : '✅ OPEN'} - Tips ${isLocked ? 'visible to all' : 'still being submitted'}`);

    // Tip counts
    const tipCount = await db.get(`SELECT COUNT(*) as count FROM tips WHERE round_id = ?`, [round.id]);
    const usersWithTips = await db.get(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM tips 
      WHERE round_id = ?
    `, [round.id]);
    const totalUsers = await db.get(`SELECT COUNT(*) as count FROM users`);

    console.log('\n👥 TIP PARTICIPATION');
    console.log(`   Total tips: ${tipCount.count}`);
    console.log(`   Users with tips: ${usersWithTips.count}/${totalUsers.count}`);
    console.log(`   Average tips per user: ${usersWithTips.count > 0 ? (tipCount.count / usersWithTips.count).toFixed(1) : '0'}`);

    // Game status
    const games = await db.all(`
      SELECT g.id, g.home_team, g.away_team, g.start_time, g.is_complete, 
             g.home_score, g.away_score, sq.complete, sq.winner
      FROM games g
      LEFT JOIN squiggle_games sq ON g.squiggle_game_key = sq.squiggle_game_key
      WHERE g.round_id = ?
      ORDER BY g.start_time
    `, [round.id]);

    console.log('\n🎯 GAME STATUS');
    for (const game of games) {
      const gameTime = new Date(game.start_time);
      const isPast = now > gameTime;
      
      let status = '';
      if (game.is_complete) {
        status = `✅ COMPLETE - ${game.winner} ${game.home_score}-${game.away_score}`;
      } else if (game.complete > 0 && game.complete < 100) {
        status = `🔄 IN PROGRESS (${game.complete}% complete)`;
      } else if (isPast) {
        status = '🕐 SHOULD HAVE STARTED';
      } else {
        const minsUntil = Math.round((gameTime.getTime() - now.getTime()) / 60000);
        if (minsUntil < 60) {
          status = `⏰ Starts in ${minsUntil} mins`;
        } else if (minsUntil < 1440) {
          status = `⏰ Starts in ${Math.round(minsUntil / 60)} hours`;
        } else {
          status = `⏰ Starts in ${Math.round(minsUntil / 1440)} days`;
        }
      }

      console.log(`\n   Game ${game.id}: ${game.home_team} vs ${game.away_team}`);
      console.log(`            ${gameTime.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
      console.log(`            ${status}`);
    }

    // Tip correctness summary
    const correctnessStats = await db.get(`
      SELECT 
        COUNT(CASE WHEN is_correct = 1 THEN 1 END) as correct,
        COUNT(CASE WHEN is_correct = 0 THEN 1 END) as incorrect,
        COUNT(CASE WHEN is_correct IS NULL THEN 1 END) as pending
      FROM tips
      WHERE round_id = ?
    `, [round.id]);

    console.log('\n📈 TIP CORRECTNESS');
    console.log(`   ✓ Correct: ${correctnessStats.correct}`);
    console.log(`   ✗ Incorrect: ${correctnessStats.incorrect}`);
    console.log(`   ⏳ Pending: ${correctnessStats.pending}`);

    // Ladder preview
    if (correctnessStats.correct > 0 || correctnessStats.incorrect > 0) {
      const topUsers = await db.all(`
        SELECT u.name, COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) as correct
        FROM tips t
        JOIN users u ON t.user_id = u.id
        WHERE t.round_id = ?
        GROUP BY u.id
        ORDER BY correct DESC, u.name ASC
        LIMIT 5
      `, [round.id]);

      console.log('\n🏆 TOP 5 LADDER');
      topUsers.forEach((user: any, i: number) => {
        console.log(`   ${i + 1}. ${user.name}: ${user.correct} correct`);
      });
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🌐 View full details at: http://localhost:5173');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

checkStatus();
