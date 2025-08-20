/**
 * Historical Tips Migration Script
 * Migrates data from historical_tips table to tips table for application use
 * 
 * Key Differences:
 * - historical_tips uses user_name → tips uses user_id (FK to users table)
 * - historical_tips uses round_number → tips uses round_id (FK to rounds table)  
 * - historical_tips has no game_id → tips needs game_id (FK to games table)
 * - tips table is what the application actually uses for display/ladder
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const OUTPUT_DIR = '../export/phase3-import';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'historical-to-tips-migration.sql');

async function createMigrationScript() {
  console.log('🔄 Creating historical_tips → tips migration script...');
  
  try {
    // 1. Connect to database and analyze data
    console.log('\n📊 Step 1: Analyzing database structure...');
    
    const db = await new Promise((resolve, reject) => {
      const database = new sqlite3.Database('./db/cooksey-plate.db', (err) => {
        if (err) reject(err);
        else resolve(database);
      });
    });
    
    // Get user mappings
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT id, name FROM users ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const userMap = {};
    users.forEach(user => {
      userMap[user.name] = user.id;
    });
    
    console.log(`  ✅ Found ${users.length} users`);
    
    // Get round mappings
    const rounds = await new Promise((resolve, reject) => {
      db.all('SELECT id, round_number, year FROM rounds WHERE year = 2025', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const roundMap = {};
    rounds.forEach(round => {
      roundMap[round.round_number] = round.id;
    });
    
    console.log(`  ✅ Found ${rounds.length} rounds for 2025`);
    
    // Get game mappings 
    const games = await new Promise((resolve, reject) => {
      db.all(`
        SELECT g.id, g.squiggle_game_key, g.round_id, r.round_number
        FROM games g 
        JOIN rounds r ON g.round_id = r.id 
        WHERE r.year = 2025
        ORDER BY r.round_number, g.squiggle_game_key
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const gameMap = {};
    games.forEach(game => {
      gameMap[game.squiggle_game_key] = game.id;
    });
    
    console.log(`  ✅ Found ${games.length} games for 2025`);
    
    // Get historical tips data for validation
    const historicalTips = await new Promise((resolve, reject) => {
      db.all(`
        SELECT DISTINCT user_name, round_number, squiggle_game_key
        FROM historical_tips 
        ORDER BY round_number, squiggle_game_key, user_name
        LIMIT 10
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`  ✅ Sample historical tips data retrieved`);
    
    db.close();
    
    // 2. Generate migration SQL
    console.log('\n🔧 Step 2: Generating migration SQL...');
    
    const sqlComponents = [];
    
    // Header
    sqlComponents.push(`-- ===================================================================
-- Historical Tips → Tips Table Migration Script
-- Generated: ${new Date().toISOString()}
-- Purpose: Migrate historical_tips data into tips table for application use
-- 
-- Key Mappings:
-- - user_name → user_id (via users table)
-- - round_number → round_id (via rounds table)
-- - squiggle_game_key → game_id (via games table)
-- ===================================================================

`);
    
    // Backup existing tips
    sqlComponents.push(`-- Backup existing tips data
DROP TABLE IF EXISTS tips_backup;
CREATE TABLE tips_backup AS SELECT * FROM tips;

-- Report backup status
SELECT 'TIPS BACKUP CREATED' as status, COUNT(*) as existing_tips FROM tips_backup;

`);
    
    // Create the migration query
    sqlComponents.push(`-- Migration Query: historical_tips → tips
-- This query maps historical data to the application's tips table structure
INSERT INTO tips (
    user_id,
    game_id, 
    squiggle_game_key,
    round_id,
    selected_team,
    is_correct,
    margin_prediction,
    is_margin_game,
    margin_difference,
    created_at,
    updated_at
)
SELECT 
    u.id as user_id,
    g.id as game_id,
    ht.squiggle_game_key,
    r.id as round_id,
    ht.selected_team,
    ht.is_correct,
    NULL as margin_prediction,      -- Historical data doesn't have margins
    0 as is_margin_game,           -- Historical games weren't margin games
    NULL as margin_difference,      -- No margin data available
    ht.imported_at as created_at,   -- Use historical import time
    ht.imported_at as updated_at    -- Use historical import time
FROM historical_tips ht
JOIN users u ON ht.user_name = u.name
JOIN rounds r ON ht.round_number = r.round_number AND r.year = 2025
JOIN games g ON ht.squiggle_game_key = g.squiggle_game_key AND g.round_id = r.id
ORDER BY ht.round_number, ht.squiggle_game_key, u.name;

`);
    
    // Verification queries
    sqlComponents.push(`-- ===================================================================
-- MIGRATION VERIFICATION
-- ===================================================================

-- Overall migration summary
SELECT 
    'MIGRATION SUMMARY' as report,
    COUNT(*) as total_tips_migrated,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT round_id) as unique_rounds,
    COUNT(DISTINCT game_id) as unique_games,
    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_tips,
    ROUND(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy_rate
FROM tips 
WHERE created_at >= (SELECT MIN(imported_at) FROM historical_tips);

-- User comparison: historical_tips vs tips
SELECT 
    'USER COMPARISON' as report,
    ht_stats.user_name,
    ht_stats.historical_tips,
    t_stats.migrated_tips,
    CASE 
        WHEN ht_stats.historical_tips = t_stats.migrated_tips THEN '✅ MATCH'
        ELSE '⚠️ MISMATCH'
    END as status
FROM (
    SELECT user_name, COUNT(*) as historical_tips
    FROM historical_tips 
    GROUP BY user_name
) ht_stats
JOIN (
    SELECT u.name as user_name, COUNT(*) as migrated_tips
    FROM tips t
    JOIN users u ON t.user_id = u.id
    WHERE t.created_at >= (SELECT MIN(imported_at) FROM historical_tips)
    GROUP BY u.name
) t_stats ON ht_stats.user_name = t_stats.user_name
ORDER BY ht_stats.user_name;

-- Round comparison
SELECT 
    'ROUND COMPARISON' as report,
    r.round_number,
    ht_count.historical_count,
    t_count.tips_count,
    CASE 
        WHEN ht_count.historical_count = t_count.tips_count THEN '✅ MATCH'
        ELSE '⚠️ MISMATCH'
    END as status
FROM rounds r
LEFT JOIN (
    SELECT round_number, COUNT(*) as historical_count
    FROM historical_tips
    GROUP BY round_number
) ht_count ON r.round_number = ht_count.round_number
LEFT JOIN (
    SELECT r2.round_number, COUNT(*) as tips_count
    FROM tips t
    JOIN rounds r2 ON t.round_id = r2.id
    WHERE t.created_at >= (SELECT MIN(imported_at) FROM historical_tips)
    GROUP BY r2.round_number
) t_count ON r.round_number = t_count.round_number
WHERE r.year = 2025 AND r.round_number BETWEEN 0 AND 23
ORDER BY r.round_number;

-- Final success check
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM tips WHERE created_at >= (SELECT MIN(imported_at) FROM historical_tips)) = 
             (SELECT COUNT(*) FROM historical_tips)
        THEN 'SUCCESS: All historical tips migrated to tips table'
        ELSE 'ERROR: Tip count mismatch - check migration'
    END as migration_result;

-- Application readiness check
SELECT 
    'APPLICATION READINESS' as check_type,
    COUNT(DISTINCT t.user_id) as users_with_tips,
    COUNT(DISTINCT t.round_id) as rounds_with_tips,
    MIN(r.round_number) as earliest_round,
    MAX(r.round_number) as latest_round
FROM tips t
JOIN rounds r ON t.round_id = r.id
WHERE t.created_at >= (SELECT MIN(imported_at) FROM historical_tips);

`);
    
    // Save migration script
    const migrationSQL = sqlComponents.join('');
    fs.writeFileSync(OUTPUT_FILE, migrationSQL);
    
    // Generate report
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        purpose: 'Migrate historical_tips to application tips table',
        sourceTable: 'historical_tips',
        targetTable: 'tips'
      },
      mappings: {
        users: {
          total: users.length,
          sample: users.slice(0, 5).map(u => ({ name: u.name, id: u.id }))
        },
        rounds: {
          total: rounds.length,
          sample: rounds.slice(0, 5).map(r => ({ round_number: r.round_number, id: r.id }))
        },
        games: {
          total: games.length,
          sample: games.slice(0, 5).map(g => ({ squiggle_game_key: g.squiggle_game_key, id: g.id }))
        }
      },
      validation: {
        userMappingComplete: Object.keys(userMap).length === users.length,
        roundMappingComplete: Object.keys(roundMap).length >= 24,
        gameMappingComplete: Object.keys(gameMap).length > 0
      }
    };
    
    // Save report
    const reportFile = path.join(OUTPUT_DIR, 'migration-analysis.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log('\n📋 MIGRATION SCRIPT GENERATION REPORT:');
    console.log('======================================');
    console.log(`👥 Users mapped: ${users.length}`);
    console.log(`🏆 Rounds mapped: ${rounds.length}`);
    console.log(`⚽ Games mapped: ${games.length}`);
    console.log(`📁 Migration SQL: ${OUTPUT_FILE}`);
    console.log(`📁 Analysis Report: ${reportFile}`);
    console.log(`🎯 Ready for migration execution`);
    
    return { migrationSQL, report, filePaths: { sql: OUTPUT_FILE, report: reportFile } };
    
  } catch (error) {
    console.error('❌ Error creating migration script:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createMigrationScript()
    .then(() => {
      console.log('\n✨ Migration script creation completed!');
    })
    .catch(error => {
      console.error('\n💥 Migration script creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createMigrationScript };