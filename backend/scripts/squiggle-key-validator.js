/**
 * Phase 3.2: Squiggle Game Key Validation
 * Validates CSV squiggle_game_keys against existing database records
 * Input: CSV file + Database squiggle_games table
 * Output: Validation report with missing games and recommendations
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const CSV_FILE = '../export/phase2-csv/tips-flat.csv';
const OUTPUT_DIR = '../export/phase3-import';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'squiggle-key-validation.json');

async function validateSquiggleGameKeys() {
  console.log('🔍 Phase 3.2: Validating squiggle_game_keys against database...');
  
  try {
    // 1. Extract unique squiggle_game_keys from CSV
    console.log('\n📊 Step 1: Extracting squiggle_game_keys from CSV...');
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    const csvLines = csvContent.split('\n').slice(1); // Skip header
    
    const csvGameKeys = new Set();
    const gameKeyDetails = new Map(); // Store game details for analysis
    
    for (const line of csvLines) {
      if (!line.trim()) continue;
      
      const columns = line.split(',');
      if (columns.length >= 4) {
        const weekNumber = parseInt(columns[1]);
        const gameNumber = parseInt(columns[2]);
        const squiggleGameKey = columns[3]?.trim();
        const homeTeam = columns[4]?.trim();
        const awayTeam = columns[5]?.trim();
        
        if (squiggleGameKey) {
          csvGameKeys.add(squiggleGameKey);
          
          // Store details for first occurrence
          if (!gameKeyDetails.has(squiggleGameKey)) {
            gameKeyDetails.set(squiggleGameKey, {
              weekNumber,
              gameNumber,
              homeTeam,
              awayTeam,
              expectedKey: String(weekNumber).padStart(2, '0') + String(gameNumber)
            });
          }
        }
      }
    }
    
    const uniqueCsvKeys = Array.from(csvGameKeys).sort();
    console.log(`  ✅ Found ${uniqueCsvKeys.length} unique squiggle_game_keys in CSV`);
    
    // 2. Get existing squiggle_game_keys from database
    console.log('\n🗄️  Step 2: Fetching existing squiggle_game_keys from database...');
    
    const dbGameKeys = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('./db/cooksey-plate.db', (err) => {
        if (err) reject(err);
      });
      
      const sql = `
        SELECT squiggle_game_key, round_number, game_number, hteam, ateam, year
        FROM squiggle_games 
        WHERE squiggle_game_key IS NOT NULL AND squiggle_game_key != ''
        ORDER BY squiggle_game_key
      `;
      
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
        db.close();
      });
    });
    
    const dbKeys = dbGameKeys.map(row => row.squiggle_game_key);
    const dbKeySet = new Set(dbKeys);
    
    console.log(`  ✅ Found ${dbKeys.length} squiggle_game_keys in database`);
    
    // 3. Validate and identify matches/mismatches
    console.log('\n🔗 Step 3: Validating game key matches...');
    
    const matches = [];
    const missingInDb = [];
    const extraInDb = [];
    
    // Check CSV keys against database
    for (const csvKey of uniqueCsvKeys) {
      if (dbKeySet.has(csvKey)) {
        const dbGame = dbGameKeys.find(row => row.squiggle_game_key === csvKey);
        const csvGame = gameKeyDetails.get(csvKey);
        
        matches.push({
          squiggleGameKey: csvKey,
          csvWeekNumber: csvGame.weekNumber,
          csvGameNumber: csvGame.gameNumber,
          dbRoundNumber: dbGame.round_number,
          dbGameNumber: dbGame.game_number,
          csvHomeTeam: csvGame.homeTeam,
          csvAwayTeam: csvGame.awayTeam,
          dbHomeTeam: dbGame.hteam,
          dbAwayTeam: dbGame.ateam,
          teamMatch: csvGame.homeTeam === dbGame.hteam && csvGame.awayTeam === dbGame.ateam,
          keyGenerationCorrect: csvKey === csvGame.expectedKey
        });
      } else {
        const csvGame = gameKeyDetails.get(csvKey);
        missingInDb.push({
          squiggleGameKey: csvKey,
          weekNumber: csvGame.weekNumber,
          gameNumber: csvGame.gameNumber,
          homeTeam: csvGame.homeTeam,
          awayTeam: csvGame.awayTeam,
          reason: 'CSV game not found in database'
        });
      }
    }
    
    // Check for database keys not in CSV (informational)
    for (const dbKey of dbKeys) {
      if (!csvGameKeys.has(dbKey)) {
        const dbGame = dbGameKeys.find(row => row.squiggle_game_key === dbKey);
        extraInDb.push({
          squiggleGameKey: dbKey,
          roundNumber: dbGame.round_number,
          gameNumber: dbGame.game_number,
          homeTeam: dbGame.hteam,
          awayTeam: dbGame.ateam,
          reason: 'Database game not in CSV (may be future games)'
        });
      }
    }
    
    // 4. Analyze validation results
    const teamMismatches = matches.filter(match => !match.teamMatch);
    const keyGenerationErrors = matches.filter(match => !match.keyGenerationCorrect);
    
    const report = {
      summary: {
        totalCsvKeys: uniqueCsvKeys.length,
        totalDbKeys: dbKeys.length,
        matches: matches.length,
        missingInDb: missingInDb.length,
        extraInDb: extraInDb.length,
        teamMismatches: teamMismatches.length,
        keyGenerationErrors: keyGenerationErrors.length,
        validationPassed: missingInDb.length === 0 && teamMismatches.length === 0,
        importReady: missingInDb.length === 0
      },
      matches,
      missingInDb,
      extraInDb,
      teamMismatches,
      keyGenerationErrors,
      csvGameKeyRange: {
        min: Math.min(...uniqueCsvKeys),
        max: Math.max(...uniqueCsvKeys)
      },
      dbGameKeyRange: {
        min: Math.min(...dbKeys),
        max: Math.max(...dbKeys)
      },
      createdAt: new Date().toISOString()
    };
    
    // 5. Save validation report
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
    
    console.log('\n📋 SQUIGGLE KEY VALIDATION REPORT:');
    console.log('===================================');
    console.log(`📊 CSV Game Keys: ${report.summary.totalCsvKeys}`);
    console.log(`🗄️  Database Game Keys: ${report.summary.totalDbKeys}`);
    console.log(`✅ Matched Keys: ${report.summary.matches}`);
    console.log(`❌ Missing in DB: ${report.summary.missingInDb}`);
    console.log(`ℹ️  Extra in DB: ${report.summary.extraInDb}`);
    console.log(`⚠️  Team Mismatches: ${report.summary.teamMismatches}`);
    console.log(`🔧 Key Generation Errors: ${report.summary.keyGenerationErrors}`);
    console.log(`🚀 Import Ready: ${report.summary.importReady ? 'YES' : 'NO'}`);
    console.log(`📁 Report saved to: ${OUTPUT_FILE}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Error validating squiggle game keys:', error);
    throw error;
  }
}

// Run validation if called directly
if (require.main === module) {
  validateSquiggleGameKeys()
    .then((report) => {
      console.log('\n✨ Phase 3.2 squiggle key validation completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Phase 3.2 squiggle key validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateSquiggleGameKeys };