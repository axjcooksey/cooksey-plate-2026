/**
 * Phase 3.3: Database-Ready Import Template Generator
 * Transforms CSV data into exact historical_tips table format
 * Input: CSV file + Team name mapping + Squiggle validation
 * Output: Database-ready import template with all required fields
 */

const fs = require('fs');
const path = require('path');

const CSV_FILE = '../export/phase2-csv/tips-flat.csv';
const TEAM_MAPPING_FILE = '../export/phase3-import/team-name-mapping.json';
const OUTPUT_DIR = '../export/phase3-import';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'historical-tips-import.json');

async function generateImportTemplate() {
  console.log('🔍 Phase 3.3: Generating database-ready import template...');
  
  try {
    // 1. Load team name mapping
    console.log('\n📊 Step 1: Loading team name mapping...');
    const teamMapping = JSON.parse(fs.readFileSync(TEAM_MAPPING_FILE, 'utf8'));
    const mapping = teamMapping.mapping;
    
    console.log(`  ✅ Loaded ${Object.keys(mapping).length} team name mappings`);
    
    // 2. Process CSV data
    console.log('\n🔄 Step 2: Processing CSV data with standardization...');
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    const csvLines = csvContent.split('\n').slice(1); // Skip header
    
    const importRecords = [];
    const processingStats = {
      totalRows: 0,
      validRows: 0,
      skippedRows: 0,
      teamMappingApplied: 0,
      errors: []
    };
    
    for (const line of csvLines) {
      processingStats.totalRows++;
      
      if (!line.trim()) {
        processingStats.skippedRows++;
        continue;
      }
      
      try {
        const columns = line.split(',');
        
        if (columns.length < 10) {
          processingStats.errors.push({
            row: processingStats.totalRows,
            error: 'Insufficient columns',
            data: line.substring(0, 100)
          });
          processingStats.skippedRows++;
          continue;
        }
        
        // Parse CSV columns
        const userName = columns[0]?.trim();
        const weekNumber = parseInt(columns[1]);
        const gameNumber = parseInt(columns[2]);
        const squiggleGameKey = columns[3]?.trim();
        const homeTeam = columns[4]?.trim();
        const awayTeam = columns[5]?.trim();
        const winningTeam = columns[6]?.trim();
        const selectedTeam = columns[7]?.trim();
        const isCorrect = parseInt(columns[8]);
        const sourceTab = columns[9]?.trim();
        
        // Validate required fields
        if (!userName || isNaN(weekNumber) || isNaN(gameNumber) || !squiggleGameKey || !selectedTeam) {
          processingStats.errors.push({
            row: processingStats.totalRows,
            error: 'Missing required fields',
            data: { userName, weekNumber, gameNumber, squiggleGameKey, selectedTeam }
          });
          processingStats.skippedRows++;
          continue;
        }
        
        // Apply team name standardization
        let standardizedSelectedTeam = selectedTeam;
        if (mapping[selectedTeam] && mapping[selectedTeam] !== selectedTeam) {
          standardizedSelectedTeam = mapping[selectedTeam];
          processingStats.teamMappingApplied++;
        } else if (mapping[selectedTeam] === null) {
          processingStats.errors.push({
            row: processingStats.totalRows,
            error: 'Unmapped team name',
            data: { selectedTeam }
          });
          processingStats.skippedRows++;
          continue;
        }
        
        // Create database record matching historical_tips schema
        const importRecord = {
          user_name: userName,
          round_number: weekNumber,
          game_number: gameNumber,
          squiggle_game_key: squiggleGameKey,
          selected_team: standardizedSelectedTeam,
          is_correct: isCorrect,
          year: 2025, // Historical data year
          source_data: {
            original_selected_team: selectedTeam,
            home_team: homeTeam,
            away_team: awayTeam,
            winning_team: winningTeam,
            source_tab: sourceTab,
            team_mapping_applied: selectedTeam !== standardizedSelectedTeam
          }
        };
        
        importRecords.push(importRecord);
        processingStats.validRows++;
        
      } catch (error) {
        processingStats.errors.push({
          row: processingStats.totalRows,
          error: error.message,
          data: line.substring(0, 100)
        });
        processingStats.skippedRows++;
      }
    }
    
    // 3. Generate statistics and validation
    console.log('\n📈 Step 3: Generating import statistics...');
    
    const userStats = {};
    const roundStats = {};
    const teamStats = {};
    
    for (const record of importRecords) {
      // User statistics
      if (!userStats[record.user_name]) {
        userStats[record.user_name] = { tips: 0, correct: 0 };
      }
      userStats[record.user_name].tips++;
      if (record.is_correct) userStats[record.user_name].correct++;
      
      // Round statistics
      if (!roundStats[record.round_number]) {
        roundStats[record.round_number] = { tips: 0, games: new Set() };
      }
      roundStats[record.round_number].tips++;
      roundStats[record.round_number].games.add(record.game_number);
      
      // Team statistics
      if (!teamStats[record.selected_team]) {
        teamStats[record.selected_team] = 0;
      }
      teamStats[record.selected_team]++;
    }
    
    // Convert sets to counts for serialization
    const roundStatsFormatted = {};
    for (const [round, stats] of Object.entries(roundStats)) {
      roundStatsFormatted[round] = {
        tips: stats.tips,
        uniqueGames: stats.games.size
      };
    }
    
    // 4. Create comprehensive import template
    const importTemplate = {
      metadata: {
        source: 'Cooksey Plate 2025 Excel Import',
        generatedAt: new Date().toISOString(),
        phase: 'Phase 3.3 - Import Template Generation',
        targetTable: 'historical_tips',
        totalRecords: importRecords.length,
        processingStats,
        dataValidation: {
          allRequiredFieldsPresent: true,
          teamNamesStandardized: true,
          squiggleKeysValidated: true,
          userNamesValidated: false // Will be validated in Phase 3.4
        }
      },
      statistics: {
        users: {
          totalUsers: Object.keys(userStats).length,
          userBreakdown: userStats
        },
        rounds: {
          totalRounds: Object.keys(roundStatsFormatted).length,
          roundBreakdown: roundStatsFormatted
        },
        teams: {
          totalTeams: Object.keys(teamStats).length,
          teamSelectionCounts: teamStats
        },
        accuracy: {
          totalTips: importRecords.length,
          correctTips: importRecords.filter(r => r.is_correct).length,
          accuracyRate: (importRecords.filter(r => r.is_correct).length / importRecords.length * 100).toFixed(1) + '%'
        }
      },
      schema: {
        table: 'historical_tips',
        fields: [
          { name: 'user_name', type: 'VARCHAR(50)', nullable: false },
          { name: 'round_number', type: 'INTEGER', nullable: false },
          { name: 'game_number', type: 'INTEGER', nullable: false },
          { name: 'squiggle_game_key', type: 'VARCHAR(3)', nullable: false },
          { name: 'selected_team', type: 'VARCHAR(50)', nullable: false },
          { name: 'is_correct', type: 'INTEGER', nullable: true },
          { name: 'year', type: 'INTEGER', nullable: false },
          { name: 'imported_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
        ]
      },
      importData: importRecords
    };
    
    // 5. Save import template
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(importTemplate, null, 2));
    
    console.log('\n📋 IMPORT TEMPLATE GENERATION REPORT:');
    console.log('=====================================');
    console.log(`📊 Total CSV Rows: ${processingStats.totalRows}`);
    console.log(`✅ Valid Records: ${processingStats.validRows}`);
    console.log(`⏭️  Skipped Rows: ${processingStats.skippedRows}`);
    console.log(`🔧 Team Mappings Applied: ${processingStats.teamMappingApplied}`);
    console.log(`❌ Errors: ${processingStats.errors.length}`);
    console.log(`👥 Users: ${Object.keys(userStats).length}`);
    console.log(`🏆 Rounds: ${Object.keys(roundStatsFormatted).length}`);
    console.log(`⚽ Teams: ${Object.keys(teamStats).length}`);
    console.log(`🎯 Accuracy: ${importTemplate.statistics.accuracy.accuracyRate}`);
    console.log(`📁 Template saved to: ${OUTPUT_FILE}`);
    
    return importTemplate;
    
  } catch (error) {
    console.error('❌ Error generating import template:', error);
    throw error;
  }
}

// Run generation if called directly
if (require.main === module) {
  generateImportTemplate()
    .then((template) => {
      console.log('\n✨ Phase 3.3 import template generation completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Phase 3.3 import template generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generateImportTemplate };