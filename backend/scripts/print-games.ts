#!/usr/bin/env node

import Database from '../src/db/database';
import dotenv from 'dotenv';

dotenv.config();

async function printGamesPerRound() {
  const db = new Database();
  
  try {
    console.log('🎮 One game per round for 2025 AFL Season:\n');
    
    // Connect to database
    await db.connect();
    
    // Get one game per round (first game of each round)
    const games = await db.all(`
      SELECT 
        round_number,
        squiggle_game_key,
        hteam,
        ateam,
        venue,
        date,
        complete,
        hscore,
        ascore,
        winner
      FROM squiggle_games 
      WHERE year = 2025 
        AND game_number = 1
      ORDER BY round_number
    `);
    
    games.forEach(game => {
      const date = new Date(game.date).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      let status: string;
      if (game.complete === 100) {
        status = `FINAL: ${game.hscore}-${game.ascore} (${game.winner})`;
      } else if (game.complete > 0) {
        status = `IN PROGRESS: ${game.hscore}-${game.ascore}`;
      } else {
        status = 'UPCOMING';
      }
      
      console.log(`Round ${game.round_number.toString().padStart(2, ' ')}: ${game.hteam} vs ${game.ateam} @ ${game.venue}`);
      console.log(`        ${date} | ${status} | Complete: ${game.complete}%`);
      console.log('');
    });
    
    console.log(`📊 Total: ${games.length} rounds displayed (first game of each round)`);
    
  } catch (error) {
    console.error('💥 Failed to print games:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

printGamesPerRound();