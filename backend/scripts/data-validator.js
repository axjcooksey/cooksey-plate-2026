/**
 * Phase 3.4: Data Validation & Integrity Checks
 * Performs comprehensive validation against database constraints
 * Input: Import template + Live database validation
 * Output: Complete validation report with import readiness assessment
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const IMPORT_TEMPLATE_FILE = '../export/phase3-import/historical-tips-import.json';
const OUTPUT_DIR = '../export/phase3-import';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'validation-report.json');

async function validateImportData() {
  console.log('🔍 Phase 3.4: Performing comprehensive data validation...');
  
  try {
    // 1. Load import template
    console.log('\n📊 Step 1: Loading import template...');
    const importTemplate = JSON.parse(fs.readFileSync(IMPORT_TEMPLATE_FILE, 'utf8'));
    const importData = importTemplate.importData;
    
    console.log(`  ✅ Loaded ${importData.length} import records`);
    
    // 2. Database connectivity and schema validation
    console.log('\n🗄️  Step 2: Validating database connectivity and schema...');
    
    const db = await new Promise((resolve, reject) => {
      const database = new sqlite3.Database('./db/cooksey-plate.db', (err) => {
        if (err) reject(err);
        else resolve(database);
      });
    });
    
    // Check if historical_tips table exists
    const tableExists = await new Promise((resolve, reject) => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='historical_tips'",
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
    
    console.log(`  ✅ historical_tips table exists: ${tableExists}`);
    
    // 3. User validation against users table
    console.log('\n👥 Step 3: Validating users against database...');
    
    const dbUsers = await new Promise((resolve, reject) => {
      db.all('SELECT name FROM users ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.name));
      });
    });
    
    const importUsers = [...new Set(importData.map(record => record.user_name))].sort();
    const missingUsers = importUsers.filter(user => !dbUsers.includes(user));
    const validUsers = importUsers.filter(user => dbUsers.includes(user));
    
    console.log(`  ✅ Database users: ${dbUsers.length}`);
    console.log(`  ✅ Import users: ${importUsers.length}`);
    console.log(`  ✅ Valid users: ${validUsers.length}`);
    console.log(`  ⚠️  Missing users: ${missingUsers.length}`);
    
    // 4. Squiggle game key validation (comprehensive)
    console.log('\n🔑 Step 4: Comprehensive squiggle game key validation...');
    
    const importGameKeys = [...new Set(importData.map(record => record.squiggle_game_key))].sort();
    
    const dbGameKeysDetailed = await new Promise((resolve, reject) => {
      db.all(
        'SELECT squiggle_game_key, round_number, game_number, hteam, ateam FROM squiggle_games WHERE squiggle_game_key IN (' + 
        importGameKeys.map(() => '?').join(',') + ')', 
        importGameKeys,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    const dbGameKeySet = new Set(dbGameKeysDetailed.map(row => row.squiggle_game_key));
    const validGameKeys = importGameKeys.filter(key => dbGameKeySet.has(key));
    const missingGameKeys = importGameKeys.filter(key => !dbGameKeySet.has(key));
    
    console.log(`  ✅ Import game keys: ${importGameKeys.length}`);
    console.log(`  ✅ Valid game keys: ${validGameKeys.length}`);
    console.log(`  ❌ Missing game keys: ${missingGameKeys.length}`);
    
    // 5. Check for existing historical tips (duplicates)
    console.log('\n🔄 Step 5: Checking for existing historical tips...');
    
    const existingTips = await new Promise((resolve, reject) => {
      db.all(
        'SELECT user_name, squiggle_game_key, COUNT(*) as count FROM historical_tips GROUP BY user_name, squiggle_game_key',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    const existingTipKeys = new Set(
      existingTips.map(tip => `${tip.user_name}:${tip.squiggle_game_key}`)
    );
    
    const potentialDuplicates = [];
    for (const record of importData) {
      const key = `${record.user_name}:${record.squiggle_game_key}`;
      if (existingTipKeys.has(key)) {
        potentialDuplicates.push(record);
      }
    }
    
    console.log(`  ✅ Existing historical tips: ${existingTips.length}`);
    console.log(`  ⚠️  Potential duplicates: ${potentialDuplicates.length}`);
    
    // 6. Data integrity checks
    console.log('\n🔬 Step 6: Performing data integrity checks...');
    
    const integrityChecks = {
      nullValues: 0,
      invalidRoundNumbers: 0,
      invalidGameNumbers: 0,
      invalidSquiggleKeys: 0,
      invalidTeamNames: 0,
      invalidYears: 0,
      invalidCorrectness: 0
    };
    
    const currentYear = new Date().getFullYear();
    
    for (const record of importData) {
      // Check for null/empty required fields
      if (!record.user_name || !record.squiggle_game_key || !record.selected_team) {
        integrityChecks.nullValues++;
      }
      
      // Check round numbers (0-23 expected)
      if (record.round_number < 0 || record.round_number > 30) {
        integrityChecks.invalidRoundNumbers++;
      }
      
      // Check game numbers (1-10 expected)
      if (record.game_number < 1 || record.game_number > 10) {
        integrityChecks.invalidGameNumbers++;
      }
      
      // Check squiggle key format (3 digits)
      if (!/^\d{3}$/.test(record.squiggle_game_key)) {
        integrityChecks.invalidSquiggleKeys++;
      }
      
      // Check year (should be reasonable)
      if (record.year < 2020 || record.year > currentYear + 1) {
        integrityChecks.invalidYears++;
      }
      
      // Check correctness values (0 or 1)
      if (record.is_correct !== 0 && record.is_correct !== 1) {
        integrityChecks.invalidCorrectness++;
      }
    }
    
    const totalIntegrityIssues = Object.values(integrityChecks).reduce((sum, count) => sum + count, 0);
    console.log(`  ✅ Data integrity issues found: ${totalIntegrityIssues}`);
    
    // 7. Generate comprehensive validation report
    const validationReport = {
      metadata: {
        validatedAt: new Date().toISOString(),
        phase: 'Phase 3.4 - Data Validation & Integrity Checks',
        totalRecords: importData.length,
        databaseConnected: true,
        tableExists
      },
      validation: {
        users: {
          totalImportUsers: importUsers.length,
          totalDbUsers: dbUsers.length,
          validUsers: validUsers.length,
          missingUsers: missingUsers.length,
          missingUsersList: missingUsers,
          userValidationPassed: missingUsers.length === 0
        },
        gameKeys: {
          totalImportKeys: importGameKeys.length,
          validKeys: validGameKeys.length,
          missingKeys: missingGameKeys.length,
          missingKeysList: missingGameKeys,
          gameKeyValidationPassed: missingGameKeys.length === 0
        },
        duplicates: {
          existingHistoricalTips: existingTips.length,
          potentialDuplicates: potentialDuplicates.length,
          duplicateValidationPassed: potentialDuplicates.length === 0,
          sampleDuplicates: potentialDuplicates.slice(0, 5).map(record => ({
            user: record.user_name,
            gameKey: record.squiggle_game_key,
            round: record.round_number,
            game: record.game_number
          }))
        },
        dataIntegrity: {
          ...integrityChecks,
          totalIssues: totalIntegrityIssues,
          integrityValidationPassed: totalIntegrityIssues === 0
        }
      },
      recommendations: [],
      importReadiness: {
        allValidationsPassed: false,
        canProceedWithImport: false,
        requiresUserAction: false,
        blockingIssues: []
      }
    };
    
    // 8. Analyze results and generate recommendations
    const { validation } = validationReport;
    
    if (!validation.users.userValidationPassed) {
      validationReport.recommendations.push({
        type: 'error',
        issue: 'Missing users in database',
        description: `${validation.users.missingUsers.length} users from import data not found in users table`,
        action: 'Create missing users or remove their tips from import',
        impact: 'blocking'
      });
      validationReport.importReadiness.blockingIssues.push('missing_users');
    }
    
    if (!validation.gameKeys.gameKeyValidationPassed) {
      validationReport.recommendations.push({
        type: 'error',
        issue: 'Missing game keys in database',
        description: `${validation.gameKeys.missingKeys.length} game keys from import data not found in squiggle_games table`,
        action: 'Import missing games from Squiggle API or remove invalid tips',
        impact: 'blocking'
      });
      validationReport.importReadiness.blockingIssues.push('missing_game_keys');
    }
    
    if (!validation.duplicates.duplicateValidationPassed) {
      validationReport.recommendations.push({
        type: 'warning',
        issue: 'Potential duplicate tips',
        description: `${validation.duplicates.potentialDuplicates.length} tips may already exist in database`,
        action: 'Clear existing historical_tips table or handle duplicates with ON CONFLICT',
        impact: 'warning'
      });
    }
    
    if (!validation.dataIntegrity.integrityValidationPassed) {
      validationReport.recommendations.push({
        type: 'error',
        issue: 'Data integrity violations',
        description: `${validation.dataIntegrity.totalIssues} data integrity issues found`,
        action: 'Fix data format issues before import',
        impact: 'blocking'
      });
      validationReport.importReadiness.blockingIssues.push('data_integrity');
    }
    
    // Determine final import readiness
    validationReport.importReadiness.allValidationsPassed = 
      validation.users.userValidationPassed &&
      validation.gameKeys.gameKeyValidationPassed &&
      validation.dataIntegrity.integrityValidationPassed;
    
    validationReport.importReadiness.canProceedWithImport = 
      validationReport.importReadiness.allValidationsPassed;
    
    validationReport.importReadiness.requiresUserAction = 
      validationReport.importReadiness.blockingIssues.length > 0;
    
    // Close database connection
    db.close();
    
    // 9. Save validation report
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validationReport, null, 2));
    
    console.log('\n📋 DATA VALIDATION REPORT:');
    console.log('==========================');
    console.log(`👥 User Validation: ${validation.users.userValidationPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🔑 Game Key Validation: ${validation.gameKeys.gameKeyValidationPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🔄 Duplicate Check: ${validation.duplicates.duplicateValidationPassed ? '✅ PASSED' : '⚠️ WARNING'}`);
    console.log(`🔬 Data Integrity: ${validation.dataIntegrity.integrityValidationPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🚀 Import Ready: ${validationReport.importReadiness.canProceedWithImport ? '✅ YES' : '❌ NO'}`);
    console.log(`📁 Report saved to: ${OUTPUT_FILE}`);
    
    return validationReport;
    
  } catch (error) {
    console.error('❌ Error during data validation:', error);
    throw error;
  }
}

// Run validation if called directly
if (require.main === module) {
  validateImportData()
    .then((report) => {
      console.log('\n✨ Phase 3.4 data validation completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Phase 3.4 data validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateImportData };