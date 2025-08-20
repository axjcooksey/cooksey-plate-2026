/**
 * Phase 2: CSV Transformer
 * Transforms raw Excel JSON data into flat CSV format
 * Input: /export/phase1-raw/*.json files
 * Output: /export/phase2-csv/tips-flat.csv
 */

const fs = require('fs');
const path = require('path');

const INPUT_DIR = '../export/phase1-raw';
const OUTPUT_DIR = '../export/phase2-csv';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'tips-flat.csv');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Family members from the database schema
const FAMILY_MEMBERS = [
  'David', 'Chris', 'Jamie', 'Emma', 'Zoe', 'Pop', 'Katie', // Ashtons & PFCs
  'Phil', 'Tracy', 'Ryan', // PJCs
  'Shannan', 'Tom', 'Billy', // Chelsea Florences
  'Alex', 'Ruby', // Richmond Cookseys
  'Mark', 'Henry', // South-East Cookseys
  'Paulie', 'Jenni', 'Charlee', // Perth Cookseys
  'Anne', 'Stephen', // Tassie Cookseys
  'Jayne', 'Ant' // Individuals
];

function transformToFlatCSV() {
  console.log('🔄 Starting CSV transformation...');
  
  const csvRows = [];
  
  // Add CSV header
  const header = 'user_name,week_number,game_number,squiggle_game_key,home_team,away_team,winning_team,selected_team,is_correct,source_tab';
  csvRows.push(header);
  
  // Process each round (Round 0 through Round 23)
  for (let roundNum = 0; roundNum <= 23; roundNum++) {
    const filename = `round_${roundNum}.json`;
    const filepath = path.join(INPUT_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  Skipping missing file: ${filename}`);
      continue;
    }
    
    console.log(`🔍 Processing ${filename}...`);
    
    try {
      const roundData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      const rawData = roundData.rawData;
      
      if (!rawData || rawData.length < 12) {
        console.log(`⚠️  Insufficient data in ${filename}, skipping`);
        continue;
      }
      
      // Extract game structure from the sheet
      const homeTeamsRow = rawData.find(row => row[1] === 'Home Team');
      const awayTeamsRow = rawData.find(row => row[1] === 'Away Team');
      const winnersRow = rawData.find(row => row[1] === 'Winner');
      
      if (!homeTeamsRow || !awayTeamsRow || !winnersRow) {
        console.log(`⚠️  Missing team/winner rows in ${filename}, skipping`);
        continue;
      }
      
      // Extract teams (columns 4-12, indices 3-11) - skip empty column 3
      const homeTeams = homeTeamsRow.slice(3, 12).filter(team => team && team.trim());
      const awayTeams = awayTeamsRow.slice(3, 12).filter(team => team && team.trim());
      const winners = winnersRow.slice(3, 12).filter(team => team && team.trim());
      
      const gameCount = Math.min(homeTeams.length, awayTeams.length, winners.length);
      console.log(`  📊 Found ${gameCount} games in round ${roundNum}`);
      
      // Process user tip rows (starting after Winner row)
      const winnerRowIndex = rawData.findIndex(row => row[1] === 'Winner');
      const userRows = rawData.slice(winnerRowIndex + 1); // Start right after Winner row
      
      let processedUsers = 0;
      
      for (const row of userRows) {
        if (!row || row.length < 3) continue;
        
        const userName = row[1];
        if (!userName) continue;
        
        // Skip debug rows
        
        if (!FAMILY_MEMBERS.includes(userName)) continue;
        
        // Extract user's tips (columns 4-12, indices 3-11) - skip team preference in column 3
        const userTips = row.slice(3, 12);
        
        // Create CSV row for each game
        for (let gameIndex = 0; gameIndex < gameCount; gameIndex++) {
          if (!userTips[gameIndex] || !homeTeams[gameIndex] || !awayTeams[gameIndex] || !winners[gameIndex]) {
            continue;
          }
          
          const selectedTeam = userTips[gameIndex].trim();
          const homeTeam = homeTeams[gameIndex].trim();
          const awayTeam = awayTeams[gameIndex].trim();
          const winningTeam = winners[gameIndex].trim();
          
          // Calculate if tip is correct (case-insensitive comparison)
          const isCorrect = (selectedTeam.toLowerCase() === winningTeam.toLowerCase()) ? 1 : 0;
          
          // Generate squiggle_game_key: RoundNumber(2 digits) + GameNumber(1 digit)
          const squiggleGameKey = String(roundNum).padStart(2, '0') + String(gameIndex + 1);
          
          // Create CSV row
          const csvRow = [
            userName,                    // user_name
            roundNum,                    // week_number  
            gameIndex + 1,               // game_number (1-based)
            squiggleGameKey,             // squiggle_game_key
            homeTeam,                    // home_team
            awayTeam,                    // away_team
            winningTeam,                 // winning_team
            selectedTeam,                // selected_team
            isCorrect,                   // is_correct
            `Round ${roundNum}`          // source_tab
          ].join(',');
          
          csvRows.push(csvRow);
        }
        
        processedUsers++;
      }
      
      console.log(`  ✅ Processed ${processedUsers} users with ${gameCount} games each`);
      
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
    }
  }
  
  // Write CSV file
  console.log(`\n💾 Writing ${csvRows.length - 1} tip records to CSV...`);
  fs.writeFileSync(OUTPUT_FILE, csvRows.join('\n'));
  
  // Create summary file
  const summary = {
    totalRecords: csvRows.length - 1, // Subtract header row
    rounds: 24, // Round 0 through Round 23
    outputFile: OUTPUT_FILE,
    csvHeader: header,
    sampleSquiggleKeys: {
      "Round 0 Game 1": "001",
      "Round 12 Game 6": "126", 
      "Round 23 Game 9": "239"
    },
    transformedAt: new Date().toISOString(),
    sampleRecord: csvRows[1] // First data row
  };
  
  const summaryFile = path.join(OUTPUT_DIR, 'transformation-summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
  console.log(`📋 Summary: ${summary.totalRecords} tip records processed`);
  console.log(`📋 Summary saved to: transformation-summary.json`);
  
  return summary;
}

// Run transformation if called directly
if (require.main === module) {
  try {
    const result = transformToFlatCSV();
    console.log('\n✨ Phase 2 transformation completed successfully!');
    console.log(`📊 Final result: ${result.totalRecords} tip records in flat CSV format`);
  } catch (error) {
    console.error('\n💥 Phase 2 transformation failed:', error);
    process.exit(1);
  }
}

module.exports = { transformToFlatCSV };