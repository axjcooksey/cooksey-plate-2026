#!/usr/bin/env ts-node
/**
 * Round 0 Testing Script
 * Populates Round 0 with sample tips for all users
 * and provides time simulation capabilities
 */

import Database from '../src/db/database';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database();

interface Game {
  id: number;
  home_team: string;
  away_team: string;
  squiggle_game_key: string;
  start_time: string;
}

interface User {
  id: number;
  name: string;
}

// Sample tip selections (alternating home/away for variety)
const TIP_PATTERNS = [
  [0, 0, 1, 1, 0], // Pattern 1: Home, Home, Away, Away, Home
  [1, 0, 0, 1, 1], // Pattern 2: Away, Home, Home, Away, Away
  [0, 1, 0, 1, 0], // Pattern 3: Home, Away, Home, Away, Home
  [1, 1, 0, 0, 1], // Pattern 4: Away, Away, Home, Home, Away
];

async function populateRound0Tips() {
  try {
    await db.connect();
    console.log('🎯 Populating Round 0 with sample tips for all users...\n');

    // Get Round 0 info
    const round = await db.get(`
      SELECT id, round_number, year, lockout_time 
      FROM rounds 
      WHERE round_number = 0 AND year = 2026
    `);

    if (!round) {
      console.error('❌ Round 0 not found!');
      process.exit(1);
    }

    console.log(`📅 Round: ${round.round_number} (ID: ${round.id})`);
    console.log(`🔒 Current lockout: ${round.lockout_time}\n`);

    // Get all games for Round 0
    const games: Game[] = await db.all(`
      SELECT id, home_team, away_team, squiggle_game_key, start_time
      FROM games
      WHERE round_id = ?
      ORDER BY start_time
    `, [round.id]);

    console.log(`🏈 Found ${games.length} games:\n`);
    games.forEach((g, i) => {
      console.log(`  Game ${i + 1}: ${g.home_team} vs ${g.away_team}`);
      console.log(`           ${new Date(g.start_time).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
    });

    // Get all users
    const users: User[] = await db.all(`SELECT id, name FROM users ORDER BY id`);
    console.log(`\n👥 Found ${users.length} users\n`);

    // Clear existing tips for Round 0
    const deleted = await db.run(`DELETE FROM tips WHERE round_id = ?`, [round.id]);
    console.log(`🗑️  Cleared ${deleted.changes || 0} existing tips\n`);

    // Populate tips for each user
    let totalTips = 0;
    for (const user of users) {
      const patternIndex = user.id % TIP_PATTERNS.length;
      const pattern = TIP_PATTERNS[patternIndex];

      console.log(`📝 Creating tips for ${user.name} (Pattern ${patternIndex + 1})...`);

      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        const selectedTeam = pattern[i] === 0 ? game.home_team : game.away_team;

        await db.run(`
          INSERT INTO tips (user_id, game_id, squiggle_game_key, round_id, selected_team, is_correct)
          VALUES (?, ?, ?, ?, ?, NULL)
        `, [user.id, game.id, game.squiggle_game_key, round.id, selectedTeam]);

        totalTips++;
      }
      console.log(`   ✓ ${games.length} tips created`);
    }

    console.log(`\n✅ Successfully created ${totalTips} tips for ${users.length} users!`);
    console.log(`📊 Average: ${(totalTips / users.length).toFixed(1)} tips per user`);

    // Show tip distribution
    console.log('\n📈 Tip Distribution:');
    for (const game of games) {
      const homeTips = await db.get(`
        SELECT COUNT(*) as count FROM tips 
        WHERE game_id = ? AND selected_team = ?
      `, [game.id, game.home_team]);

      const awayTips = await db.get(`
        SELECT COUNT(*) as count FROM tips 
        WHERE game_id = ? AND selected_team = ?
      `, [game.id, game.away_team]);

      console.log(`  ${game.home_team} vs ${game.away_team}`);
      console.log(`    ${game.home_team}: ${homeTips.count} tips`);
      console.log(`    ${game.away_team}: ${awayTips.count} tips`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

populateRound0Tips();
