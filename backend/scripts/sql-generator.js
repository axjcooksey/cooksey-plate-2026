/**
 * Phase 3.5: SQL Insert Script Generator
 * Generates production-ready SQL scripts for importing historical tips
 * Input: Validated import template
 * Output: Complete SQL script with transactions and error handling
 */

const fs = require('fs');
const path = require('path');

const IMPORT_TEMPLATE_FILE = '../export/phase3-import/historical-tips-import.json';
const OUTPUT_DIR = '../export/phase3-import';
const SQL_OUTPUT_FILE = path.join(OUTPUT_DIR, 'historical-tips-insert.sql');
const BATCH_OUTPUT_FILE = path.join(OUTPUT_DIR, 'import-batches.json');

// Configuration
const BATCH_SIZE = 500; // Records per transaction batch
const ENABLE_FOREIGN_KEYS = true;
const ENABLE_TRANSACTIONS = true;
const INCLUDE_BACKUP_STATEMENTS = true;

function generateSQLScript() {
  console.log('🔍 Phase 3.5: Generating SQL insert script...');
  
  try {
    // 1. Load validated import template
    console.log('\n📊 Step 1: Loading validated import template...');
    const importTemplate = JSON.parse(fs.readFileSync(IMPORT_TEMPLATE_FILE, 'utf8'));
    const importData = importTemplate.importData;
    
    console.log(`  ✅ Loaded ${importData.length} validated records`);
    
    // 2. Generate SQL script components
    console.log('\n🔧 Step 2: Generating SQL script components...');
    
    const sqlComponents = [];
    
    // Header comment
    sqlComponents.push(`-- ===================================================================
-- Historical Tips Import Script
-- Generated: ${new Date().toISOString()}
-- Source: Cooksey Plate 2025 Excel Import (Phases 1-3)
-- Records: ${importData.length} historical tips
-- Coverage: Round 0-23 (2025 season)
-- Users: ${Object.keys(importTemplate.statistics.users.userBreakdown).length} family members
-- ===================================================================

`);
    
    // Pragma settings for SQLite
    if (ENABLE_FOREIGN_KEYS) {
      sqlComponents.push('-- Enable foreign key constraints\n');
      sqlComponents.push('PRAGMA foreign_keys = ON;\n\n');
    }
    
    // Backup existing data (if any)
    if (INCLUDE_BACKUP_STATEMENTS) {
      sqlComponents.push(`-- Backup existing historical_tips data
-- (Create backup table before import)
DROP TABLE IF EXISTS historical_tips_backup;
CREATE TABLE historical_tips_backup AS SELECT * FROM historical_tips;

-- Report on existing data
SELECT 
    'BACKUP CREATED' as status,
    COUNT(*) as existing_records 
FROM historical_tips_backup;

`);
    }
    
    // 3. Create batched insert statements
    console.log('\n📦 Step 3: Creating batched insert statements...');
    
    const batches = [];
    const totalBatches = Math.ceil(importData.length / BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, importData.length);
      const batchData = importData.slice(startIndex, endIndex);
      
      const batchInfo = {
        batchNumber: batchIndex + 1,
        totalBatches,
        recordCount: batchData.length,
        startIndex,
        endIndex: endIndex - 1,
        users: [...new Set(batchData.map(r => r.user_name))],
        rounds: [...new Set(batchData.map(r => r.round_number))].sort((a, b) => a - b)
      };
      
      batches.push(batchInfo);
      
      // Generate SQL for this batch
      sqlComponents.push(`-- ===================================================================
-- Batch ${batchInfo.batchNumber}/${batchInfo.totalBatches}: Records ${startIndex + 1}-${endIndex}
-- Users in batch: ${batchInfo.users.join(', ')}
-- Rounds in batch: ${batchInfo.rounds.join(', ')}
-- ===================================================================

`);
      
      if (ENABLE_TRANSACTIONS) {
        sqlComponents.push('BEGIN TRANSACTION;\n\n');
      }
      
      // Create INSERT statement
      sqlComponents.push(`INSERT INTO historical_tips (
    user_name,
    round_number,
    game_number,
    squiggle_game_key,
    selected_team,
    is_correct,
    year,
    imported_at
) VALUES\n`);
      
      // Generate VALUES clauses
      const valuesClauses = batchData.map((record, index) => {
        const values = [
          `'${record.user_name.replace(/'/g, "''")}'`, // Escape single quotes
          record.round_number,
          record.game_number,
          `'${record.squiggle_game_key}'`,
          `'${record.selected_team.replace(/'/g, "''")}'`, // Escape single quotes
          record.is_correct,
          record.year,
          'CURRENT_TIMESTAMP'
        ];
        
        const isLast = index === batchData.length - 1;
        return `    (${values.join(', ')})${isLast ? ';' : ','}`;
      });
      
      sqlComponents.push(valuesClauses.join('\n'));
      sqlComponents.push('\n\n');
      
      // Batch verification query
      sqlComponents.push(`-- Verify batch ${batchInfo.batchNumber} insertion
SELECT 
    'BATCH ${batchInfo.batchNumber} COMPLETED' as status,
    COUNT(*) as records_inserted,
    COUNT(DISTINCT user_name) as unique_users,
    MIN(round_number) as min_round,
    MAX(round_number) as max_round
FROM historical_tips 
WHERE imported_at >= (
    SELECT MAX(imported_at) 
    FROM historical_tips 
    WHERE imported_at < CURRENT_TIMESTAMP
);

`);
      
      if (ENABLE_TRANSACTIONS) {
        sqlComponents.push('COMMIT;\n\n');
      }
    }
    
    // 4. Final verification and summary
    sqlComponents.push(`-- ===================================================================
-- FINAL VERIFICATION AND SUMMARY
-- ===================================================================

-- Complete import summary
SELECT 
    'IMPORT COMPLETED' as status,
    COUNT(*) as total_historical_tips,
    COUNT(DISTINCT user_name) as total_users,
    COUNT(DISTINCT round_number) as total_rounds,
    COUNT(DISTINCT squiggle_game_key) as total_games,
    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as total_correct_tips,
    ROUND(
        (SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
        2
    ) as accuracy_percentage,
    MIN(imported_at) as first_import_time,
    MAX(imported_at) as last_import_time
FROM historical_tips;

-- User breakdown
SELECT 
    'USER BREAKDOWN' as report_type,
    user_name,
    COUNT(*) as total_tips,
    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_tips,
    ROUND(
        (SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
        2
    ) as accuracy_percentage
FROM historical_tips 
GROUP BY user_name 
ORDER BY correct_tips DESC, accuracy_percentage DESC;

-- Round breakdown  
SELECT 
    'ROUND BREAKDOWN' as report_type,
    round_number,
    COUNT(*) as total_tips,
    COUNT(DISTINCT user_name) as users,
    COUNT(DISTINCT squiggle_game_key) as games,
    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_tips
FROM historical_tips 
GROUP BY round_number 
ORDER BY round_number;

-- Final success confirmation
SELECT 
    CASE 
        WHEN COUNT(*) = ${importData.length} THEN 'SUCCESS: All ${importData.length} records imported correctly'
        ELSE 'ERROR: Expected ${importData.length} records, found ' || COUNT(*) || ' records'
    END as import_result
FROM historical_tips;

`);
    
    // 5. Save SQL script
    const finalSQL = sqlComponents.join('');
    fs.writeFileSync(SQL_OUTPUT_FILE, finalSQL);
    
    // 6. Save batch information
    const batchSummary = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRecords: importData.length,
        totalBatches: totalBatches,
        batchSize: BATCH_SIZE,
        settings: {
          enableForeignKeys: ENABLE_FOREIGN_KEYS,
          enableTransactions: ENABLE_TRANSACTIONS,
          includeBackupStatements: INCLUDE_BACKUP_STATEMENTS
        }
      },
      batches,
      execution: {
        estimatedTime: `${Math.ceil(totalBatches * 0.5)} seconds`,
        recommendedApproach: 'Execute entire script at once for transactional integrity',
        rollbackPlan: 'DROP TABLE historical_tips; ALTER TABLE historical_tips_backup RENAME TO historical_tips;'
      }
    };
    
    fs.writeFileSync(BATCH_OUTPUT_FILE, JSON.stringify(batchSummary, null, 2));
    
    // 7. Generate execution statistics
    console.log('\n📋 SQL GENERATION REPORT:');
    console.log('=========================');
    console.log(`📊 Total Records: ${importData.length}`);
    console.log(`📦 Batches Generated: ${totalBatches}`);
    console.log(`📏 Batch Size: ${BATCH_SIZE} records`);
    console.log(`🔒 Transactions Enabled: ${ENABLE_TRANSACTIONS ? 'Yes' : 'No'}`);
    console.log(`🔗 Foreign Keys Enabled: ${ENABLE_FOREIGN_KEYS ? 'Yes' : 'No'}`);
    console.log(`💾 Backup Statements: ${INCLUDE_BACKUP_STATEMENTS ? 'Yes' : 'No'}`);
    console.log(`📄 SQL File Size: ${Math.round(finalSQL.length / 1024)} KB`);
    console.log(`⏱️  Estimated Execution: ${batchSummary.execution.estimatedTime}`);
    console.log(`📁 SQL Script: ${SQL_OUTPUT_FILE}`);
    console.log(`📁 Batch Info: ${BATCH_OUTPUT_FILE}`);
    
    return {
      sqlScript: finalSQL,
      batchSummary,
      filePaths: {
        sql: SQL_OUTPUT_FILE,
        batchInfo: BATCH_OUTPUT_FILE
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating SQL script:', error);
    throw error;
  }
}

// Run generation if called directly
if (require.main === module) {
  try {
    const result = generateSQLScript();
    console.log('\n✨ Phase 3.5 SQL script generation completed!');
    console.log('🎯 Ready for database import execution');
  } catch (error) {
    console.error('\n💥 Phase 3.5 SQL script generation failed:', error);
    process.exit(1);
  }
}

module.exports = { generateSQLScript };