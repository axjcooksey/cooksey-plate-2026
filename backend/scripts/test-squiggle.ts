#!/usr/bin/env node

import Database from '../src/db/database';
import SquiggleService from '../src/services/SquiggleService';
import dotenv from 'dotenv';

dotenv.config();

async function testSquiggleIntegration() {
  const db = new Database();
  
  try {
    console.log('🧪 Testing Squiggle API integration...');
    
    // Connect to database
    await db.connect();
    
    // Create Squiggle service
    const squiggleService = new SquiggleService(db);
    
    // Test API connection first
    console.log('🌐 Testing API connection...');
    const testResponse = await squiggleService.fetchGames(2025, 1); // Fetch Round 1 2025
    console.log(`✅ API test successful - ${testResponse.games.length} games found for Round 1 2025`);
    
    // Process and display sample data
    if (testResponse.games.length > 0) {
      const processedGames = squiggleService.processGames(testResponse.games, 2025);
      console.log('\n📋 Sample processed games:');
      
      processedGames.slice(0, 3).forEach(game => {
        console.log(`  ${game.squiggleGameKey}: ${game.homeTeam} vs ${game.awayTeam} @ ${game.venue}`);
        console.log(`    Date: ${game.date.toISOString()}`);
        console.log(`    Complete: ${game.complete ? 'Yes' : 'No'}`);
        if (game.complete) {
          console.log(`    Score: ${game.homeTeam} ${game.homeScore} - ${game.awayScore} ${game.awayTeam}`);
        }
        console.log('');
      });
      
      // Test saving to database
      console.log('💾 Testing database save...');
      await squiggleService.saveGamesToDatabase(processedGames.slice(0, 3)); // Save only first 3 for testing
      console.log('✅ Database save successful');
      
      // Verify data was saved
      const savedGames = await db.all('SELECT * FROM squiggle_games WHERE year = ? ORDER BY round_number, game_number LIMIT 3', [2025]);
      console.log(`📊 Verified: ${savedGames.length} games saved to database`);
      
      savedGames.forEach(game => {
        console.log(`  ${game.squiggle_game_key}: ${game.hteam} vs ${game.ateam}`);
      });
    }
    
    // Test full year update (uncomment to run full import)
    console.log('\n🔄 Testing full year update...');
    const gameCount = await squiggleService.updateGamesForYear(2025);
    console.log(`✅ Full update successful - ${gameCount} games processed for 2025`);
    
    // Show summary stats
    const totalGames = await db.get('SELECT COUNT(*) as count FROM squiggle_games WHERE year = ?', [2025]);
    const totalRounds = await db.get('SELECT COUNT(DISTINCT round_number) as count FROM squiggle_games WHERE year = ?', [2025]);
    const completedGames = await db.get('SELECT COUNT(*) as count FROM squiggle_games WHERE year = ? AND complete = 1', [2025]);
    
    console.log('\n📊 2025 Season Summary:');
    console.log(`   Total games: ${totalGames.count}`);
    console.log(`   Rounds: ${totalRounds.count}`);
    console.log(`   Completed: ${completedGames.count}`);
    
    // Test cache
    console.log('\n💾 Cache stats:');
    const cacheStats = squiggleService.getCacheStats();
    console.log(`   Cached items: ${cacheStats.size}`);
    console.log(`   Cache keys: ${cacheStats.keys.join(', ')}`);
    
    console.log('\n🎉 Squiggle integration test completed successfully!');
    
  } catch (error) {
    console.error('💥 Squiggle integration test failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

testSquiggleIntegration();