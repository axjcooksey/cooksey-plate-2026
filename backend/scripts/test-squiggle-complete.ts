#!/usr/bin/env node

import Database from '../src/db/database';
import SquiggleService from '../src/services/SquiggleService';
import dotenv from 'dotenv';

dotenv.config();

async function testCompleteSquiggleIntegration() {
  const db = new Database();
  
  try {
    console.log('🧪 Testing complete Squiggle API integration...');
    
    // Connect to database
    await db.connect();
    
    // Create Squiggle service
    const squiggleService = new SquiggleService(db);
    
    // 1. Test and update teams
    console.log('\n1. 🏆 Testing Teams API...');
    const teamCount = await squiggleService.updateTeams();
    console.log(`✅ Teams updated: ${teamCount} teams processed`);
    
    const teams = await db.all('SELECT * FROM teams ORDER BY name LIMIT 5');
    console.log('📋 Sample teams:');
    teams.forEach(team => {
      console.log(`   ${team.name} (${team.abbrev}) - ID: ${team.id}`);
    });
    
    // 2. Re-fetch and update games with all fields
    console.log('\n2. 🎯 Re-fetching games with complete field fixes...');
    const gameCount = await squiggleService.updateGamesForYear(2025);
    console.log(`✅ Games updated: ${gameCount} games processed`);
    
    // 3. Test complete field values
    console.log('\n3. 📊 Testing complete field values...');
    const completeStats = await db.get(`
      SELECT 
        COUNT(*) as total_games,
        COUNT(CASE WHEN complete = 0 THEN 1 END) as not_started,
        COUNT(CASE WHEN complete > 0 AND complete < 100 THEN 1 END) as in_progress,
        COUNT(CASE WHEN complete = 100 THEN 1 END) as completed,
        AVG(complete) as avg_complete
      FROM squiggle_games 
      WHERE year = 2025
    `);
    
    console.log('🔢 Complete field statistics:');
    console.log(`   Total games: ${completeStats.total_games}`);
    console.log(`   Not started (0): ${completeStats.not_started}`);
    console.log(`   In progress (1-99): ${completeStats.in_progress}`);
    console.log(`   Completed (100): ${completeStats.completed}`);
    console.log(`   Average complete value: ${completeStats.avg_complete?.toFixed(2)}`);
    
    // 4. Show sample games with all new fields
    console.log('\n4. 📋 Sample games with all fields:');
    const sampleGames = await db.all(`
      SELECT 
        squiggle_game_key, round_number, hteam, ateam, venue,
        complete, hscore, ascore, winner, 
        localtime, hmargin, is_final, is_grand_final
      FROM squiggle_games 
      WHERE year = 2025
      ORDER BY round_number, game_number
      LIMIT 3
    `);
    
    sampleGames.forEach(game => {
      console.log(`   ${game.squiggle_game_key}: ${game.hteam} vs ${game.ateam}`);
      console.log(`     Venue: ${game.venue}, Complete: ${game.complete}%`);
      console.log(`     Score: ${game.hscore || 0} - ${game.ascore || 0}, Winner: ${game.winner || 'TBD'}`);
      console.log(`     Margin: ${game.hmargin || 0}, Final: ${game.is_final ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // 5. Print one game per round as requested
    console.log('\n5. 🎮 One game per round (Rounds 1-10):');
    const oneGamePerRound = await db.all(`
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
        AND round_number <= 10
        AND game_number = 1
      ORDER BY round_number
    `);
    
    oneGamePerRound.forEach(game => {
      const date = new Date(game.date).toLocaleDateString('en-AU');
      const status = game.complete === 100 ? `FINAL: ${game.hscore}-${game.ascore} (${game.winner})` : 
                   game.complete > 0 ? `IN PROGRESS: ${game.hscore}-${game.ascore}` : 'UPCOMING';
      
      console.log(`Round ${game.round_number}: ${game.hteam} vs ${game.ateam} @ ${game.venue}`);
      console.log(`   Date: ${date}, Status: ${status}`);
      console.log('');
    });
    
    // 6. Cache statistics
    console.log('\n6. 💾 Cache Statistics:');
    const cacheStats = squiggleService.getCacheStats();
    console.log(`   Cached items: ${cacheStats.size}`);
    console.log(`   Cache keys: ${cacheStats.keys.join(', ')}`);
    
    console.log('\n🎉 Complete Squiggle integration test successful!');
    
  } catch (error) {
    console.error('💥 Complete Squiggle integration test failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

testCompleteSquiggleIntegration();