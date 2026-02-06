#!/usr/bin/env ts-node
/**
 * Time Simulation Script
 * Simulates different time scenarios for Round 0 testing
 * 
 * Usage:
 *   npm run simulate-time -- pre-lockout    # 30 mins before first game
 *   npm run simulate-time -- post-lockout   # 30 mins after first game starts
 *   npm run simulate-time -- mid-round      # After 2 games complete
 *   npm run simulate-time -- post-round     # Tuesday after round complete
 *   npm run simulate-time -- reset          # Reset to real times
 */

import Database from '../src/db/database';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database();

// Actual Round 0 game times (from Squiggle API)
const ACTUAL_GAME_TIMES = {
  game1: '2026-03-05 19:30:00', // Sydney vs Carlton (AEDT)
  game2: '2026-03-06 19:05:00', // Gold Coast vs Geelong
  game3: '2026-03-07 16:15:00', // GWS vs Hawthorn
  game4: '2026-03-07 18:35:00', // Brisbane vs Western Bulldogs
  game5: '2026-03-08 19:20:00', // St Kilda vs Collingwood
};

interface Scenario {
  name: string;
  description: string;
  apply: () => Promise<void>;
}

async function updateGameTime(gameId: number, newTime: string, complete: number = 0, winner?: string, homeScore: number = 0, awayScore: number = 0) {
  // Update squiggle_games
  await db.run(`
    UPDATE squiggle_games 
    SET date = ?, complete = ?, winner = ?, hscore = ?, ascore = ?
    WHERE squiggle_game_key = (SELECT squiggle_game_key FROM games WHERE id = ?)
  `, [newTime, complete, winner, homeScore, awayScore, gameId]);

  // Update games table
  await db.run(`
    UPDATE games 
    SET start_time = ?, is_complete = ?, home_score = ?, away_score = ?
    WHERE id = ?
  `, [newTime, complete === 100 ? 1 : 0, homeScore, awayScore, gameId]);
}

async function updateRoundLockout(roundId: number, lockoutTime: string) {
  await db.run(`UPDATE rounds SET lockout_time = ? WHERE id = ?`, [lockoutTime, roundId]);
}

async function updateRoundStatus(roundId: number, status: string) {
  await db.run(`UPDATE rounds SET status = ? WHERE id = ?`, [status, roundId]);
}

async function calculateTipCorrectness(gameId: number, winner: string) {
  await db.run(`
    UPDATE tips 
    SET is_correct = CASE 
      WHEN selected_team = ? THEN 1 
      ELSE 0 
    END
    WHERE game_id = ?
  `, [winner, gameId]);
}

const scenarios: Record<string, Scenario> = {
  'pre-lockout': {
    name: '30 Minutes Before Lockout',
    description: 'Tips are still open, users can submit/change tips',
    apply: async () => {
      const now = new Date();
      const lockoutTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins from now

      // Set all games 30+ mins in future
      await updateGameTime(1, new Date(now.getTime() + 30 * 60 * 1000).toISOString());
      await updateGameTime(2, new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString());
      await updateGameTime(3, new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString());
      await updateGameTime(4, new Date(now.getTime() + 48.5 * 60 * 60 * 1000).toISOString());
      await updateGameTime(5, new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString());

      await updateRoundLockout(3, lockoutTime.toISOString());
      await updateRoundStatus(3, 'upcoming');

      // Clear all tip correctness
      await db.run(`UPDATE tips SET is_correct = NULL WHERE round_id = 3`);

      console.log('✅ Scenario applied:');
      console.log(`   Current time: ${now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
      console.log(`   Lockout time: ${lockoutTime.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
      console.log(`   Status: Tips are OPEN - users can still submit/change`);
    }
  },

  'post-lockout': {
    name: '30 Minutes After First Game Starts',
    description: 'Round is locked, tips visible, first game in progress',
    apply: async () => {
      const now = new Date();
      const lockoutTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 mins ago

      // First game started 30 mins ago (in progress)
      await updateGameTime(1, lockoutTime.toISOString(), 50); // 50% complete

      // Other games still upcoming
      await updateGameTime(2, new Date(now.getTime() + 23.5 * 60 * 60 * 1000).toISOString());
      await updateGameTime(3, new Date(now.getTime() + 47.5 * 60 * 60 * 1000).toISOString());
      await updateGameTime(4, new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString());
      await updateGameTime(5, new Date(now.getTime() + 71.5 * 60 * 60 * 1000).toISOString());

      await updateRoundLockout(3, lockoutTime.toISOString());
      await updateRoundStatus(3, 'active');

      // Clear tip correctness (game not complete yet)
      await db.run(`UPDATE tips SET is_correct = NULL WHERE round_id = 3`);

      console.log('✅ Scenario applied:');
      console.log(`   Current time: ${now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
      console.log(`   Lockout time: ${lockoutTime.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
      console.log(`   Status: Round LOCKED - tips visible to all`);
      console.log(`   Game 1: IN PROGRESS (50% complete)`);
    }
  },

  'mid-round': {
    name: 'Mid-Round - 2 Games Complete',
    description: 'First 2 games finished with scores, tips calculated',
    apply: async () => {
      const now = new Date();
      const game1Time = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago
      const game2Time = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

      // Game 1: Complete - Sydney won
      await updateGameTime(1, game1Time.toISOString(), 100, 'Sydney', 98, 76);
      await calculateTipCorrectness(1, 'Sydney');

      // Game 2: Complete - Geelong won
      await updateGameTime(2, game2Time.toISOString(), 100, 'Geelong', 112, 88);
      await calculateTipCorrectness(2, 'Geelong');

      // Game 3: In progress
      await updateGameTime(3, new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), 75);

      // Games 4-5: Upcoming
      await updateGameTime(4, new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString());
      await updateGameTime(5, new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString());

      await updateRoundLockout(3, game1Time.toISOString());
      await updateRoundStatus(3, 'active');

      console.log('✅ Scenario applied:');
      console.log(`   Current time: ${now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
      console.log(`   Status: Round ACTIVE`);
      console.log(`   Game 1: COMPLETE - Sydney 98 def Carlton 76`);
      console.log(`   Game 2: COMPLETE - Geelong 112 def Gold Coast 88`);
      console.log(`   Game 3: IN PROGRESS (75% complete)`);
      console.log(`   Games 4-5: Upcoming`);
      console.log(`   Tips calculated for completed games`);
    }
  },

  'post-round': {
    name: 'Tuesday After Round Complete',
    description: 'All games finished, full results and ladder updated',
    apply: async () => {
      const now = new Date();
      const baseTime = new Date(now.getTime() - 96 * 60 * 60 * 1000); // 4 days ago

      // All games complete with scores
      await updateGameTime(1, new Date(baseTime.getTime()).toISOString(), 100, 'Sydney', 98, 76);
      await calculateTipCorrectness(1, 'Sydney');

      await updateGameTime(2, new Date(baseTime.getTime() + 24 * 60 * 60 * 1000).toISOString(), 100, 'Geelong', 112, 88);
      await calculateTipCorrectness(2, 'Geelong');

      await updateGameTime(3, new Date(baseTime.getTime() + 48 * 60 * 60 * 1000).toISOString(), 100, 'Hawthorn', 95, 92);
      await calculateTipCorrectness(3, 'Hawthorn');

      await updateGameTime(4, new Date(baseTime.getTime() + 48.5 * 60 * 60 * 1000).toISOString(), 100, 'Brisbane Lions', 108, 71);
      await calculateTipCorrectness(4, 'Brisbane Lions');

      await updateGameTime(5, new Date(baseTime.getTime() + 72 * 60 * 60 * 1000).toISOString(), 100, 'Collingwood', 89, 84);
      await calculateTipCorrectness(5, 'Collingwood');

      await updateRoundLockout(3, baseTime.toISOString());
      await updateRoundStatus(3, 'completed');

      console.log('✅ Scenario applied:');
      console.log(`   Current time: ${now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
      console.log(`   Status: Round COMPLETED`);
      console.log(`   All 5 games finished with results:`);
      console.log(`     Game 1: Sydney 98 def Carlton 76`);
      console.log(`     Game 2: Geelong 112 def Gold Coast 88`);
      console.log(`     Game 3: Hawthorn 95 def GWS 92`);
      console.log(`     Game 4: Brisbane Lions 108 def Western Bulldogs 71`);
      console.log(`     Game 5: Collingwood 89 def St Kilda 84`);
      console.log(`   All tips calculated - check ladder!`);
    }
  },

  'reset': {
    name: 'Reset to Real Times',
    description: 'Restore original Squiggle API times and clear test data',
    apply: async () => {
      // Reset to actual times from Squiggle
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

      await updateRoundLockout(3, '2026-03-05T08:30:00.000Z');
      await updateRoundStatus(3, 'upcoming');

      // Clear tip correctness
      await db.run(`UPDATE tips SET is_correct = NULL WHERE round_id = 3`);

      console.log('✅ Reset complete:');
      console.log(`   All times restored to original Squiggle values`);
      console.log(`   Round status: upcoming`);
      console.log(`   Tip correctness cleared`);
    }
  }
};

async function main() {
  const scenario = process.argv[2];

  if (!scenario || !scenarios[scenario]) {
    console.log('🎬 Time Simulation Script for Round 0 Testing\n');
    console.log('Usage: npm run simulate-time -- <scenario>\n');
    console.log('Available scenarios:');
    Object.entries(scenarios).forEach(([key, s]) => {
      console.log(`  ${key.padEnd(15)} - ${s.description}`);
    });
    console.log('\nExample: npm run simulate-time -- pre-lockout');
    process.exit(1);
  }

  try {
    await db.connect();
    console.log(`\n🎬 Applying scenario: ${scenarios[scenario].name}\n`);
    
    await scenarios[scenario].apply();
    
    console.log('\n✅ Time simulation complete!');
    console.log('🌐 View results at: http://localhost:5173\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

main();
