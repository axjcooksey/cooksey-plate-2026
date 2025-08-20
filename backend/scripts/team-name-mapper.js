/**
 * Phase 3.1: Team Name Standardization Mapping
 * Creates mapping between CSV team names and database standard names
 * Input: CSV file + Database query
 * Output: Team name mapping validation report
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const CSV_FILE = '../export/phase2-csv/tips-flat.csv';
const OUTPUT_DIR = '../export/phase3-import';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'team-name-mapping.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function createTeamNameMapping() {
  console.log('🔍 Phase 3.1: Creating team name standardization mapping...');
  
  try {
    // 1. Extract unique team names from CSV
    console.log('\n📊 Step 1: Extracting team names from CSV...');
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    const csvLines = csvContent.split('\n').slice(1); // Skip header
    
    const csvTeamNames = new Set();
    
    for (const line of csvLines) {
      if (!line.trim()) continue;
      
      const columns = line.split(',');
      if (columns.length >= 8) {
        // Extract home_team, away_team, winning_team, selected_team
        csvTeamNames.add(columns[4]?.trim()); // home_team
        csvTeamNames.add(columns[5]?.trim()); // away_team  
        csvTeamNames.add(columns[6]?.trim()); // winning_team
        csvTeamNames.add(columns[7]?.trim()); // selected_team
      }
    }
    
    // Remove empty values
    csvTeamNames.delete('');
    csvTeamNames.delete(undefined);
    
    const uniqueCsvTeams = Array.from(csvTeamNames).sort();
    console.log(`  ✅ Found ${uniqueCsvTeams.length} unique team names in CSV`);
    
    // 2. Get standard team names from database
    console.log('\n🗄️  Step 2: Fetching standard team names from database...');
    
    const standardTeamNames = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('./db/cooksey-plate.db', (err) => {
        if (err) reject(err);
      });
      
      const sql = `
        SELECT DISTINCT hteam as team_name 
        FROM squiggle_games 
        WHERE hteam IS NOT NULL AND hteam != ''
        UNION
        SELECT DISTINCT ateam as team_name 
        FROM squiggle_games 
        WHERE ateam IS NOT NULL AND ateam != ''
        ORDER BY team_name
      `;
      
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.team_name));
        db.close();
      });
    });
    
    console.log(`  ✅ Found ${standardTeamNames.length} standard team names in database`);
    
    // 3. Create mapping logic
    console.log('\n🔗 Step 3: Creating team name mappings...');
    
    const mapping = {};
    const issues = [];
    const perfectMatches = [];
    
    for (const csvTeam of uniqueCsvTeams) {
      // Try exact match first
      if (standardTeamNames.includes(csvTeam)) {
        mapping[csvTeam] = csvTeam;
        perfectMatches.push(csvTeam);
        continue;
      }
      
      // Try case-insensitive match
      const caseMatch = standardTeamNames.find(
        dbTeam => dbTeam.toLowerCase() === csvTeam.toLowerCase()
      );
      
      if (caseMatch) {
        mapping[csvTeam] = caseMatch;
        continue;
      }
      
      // Try fuzzy matching for common issues
      let fuzzyMatch = null;
      
      // Handle common variations
      const csvLower = csvTeam.toLowerCase();
      
      if (csvLower === 'cartlon') {
        fuzzyMatch = 'Carlton';
      } else if (csvLower.includes('brisbane') && csvLower.includes('lion')) {
        fuzzyMatch = 'Brisbane Lions';
      } else if (csvLower.includes('greater western')) {
        fuzzyMatch = 'Greater Western Sydney';
      } else if (csvLower.includes('western bulldogs') || csvLower.includes('bulldogs')) {
        fuzzyMatch = 'Western Bulldogs';
      } else if (csvLower === 'gws') {
        fuzzyMatch = 'Greater Western Sydney';
      } else if (csvLower.includes('st kilda') || csvLower.includes('saints')) {
        fuzzyMatch = 'St Kilda';
      } else if (csvLower.includes('west coast') || csvLower.includes('eagles')) {
        fuzzyMatch = 'West Coast';
      } else {
        // Try partial string matching
        fuzzyMatch = standardTeamNames.find(dbTeam => 
          dbTeam.toLowerCase().includes(csvLower) || 
          csvLower.includes(dbTeam.toLowerCase())
        );
      }
      
      if (fuzzyMatch) {
        mapping[csvTeam] = fuzzyMatch;
      } else {
        // No match found - flag as issue
        mapping[csvTeam] = null;
        issues.push({
          csvName: csvTeam,
          reason: 'No matching standard team name found',
          suggestions: standardTeamNames.filter(team => 
            team.toLowerCase().includes(csvTeam.toLowerCase().substring(0, 3))
          )
        });
      }
    }
    
    // 4. Generate comprehensive report
    const report = {
      summary: {
        totalCsvTeams: uniqueCsvTeams.length,
        totalDbTeams: standardTeamNames.length,
        perfectMatches: perfectMatches.length,
        fuzzyMatches: Object.keys(mapping).length - perfectMatches.length - issues.length,
        issues: issues.length,
        mappingComplete: issues.length === 0
      },
      standardTeamNames,
      csvTeamNames: uniqueCsvTeams,
      mapping,
      perfectMatches,
      issues,
      createdAt: new Date().toISOString()
    };
    
    // 5. Save mapping file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
    
    console.log('\n📋 TEAM NAME MAPPING REPORT:');
    console.log('=====================================');
    console.log(`📊 CSV Team Names: ${report.summary.totalCsvTeams}`);
    console.log(`🗄️  Database Team Names: ${report.summary.totalDbTeams}`);
    console.log(`✅ Perfect Matches: ${report.summary.perfectMatches}`);
    console.log(`🔧 Fuzzy Matches: ${report.summary.fuzzyMatches}`);
    console.log(`⚠️  Issues: ${report.summary.issues}`);
    console.log(`📁 Report saved to: ${OUTPUT_FILE}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Error creating team name mapping:', error);
    throw error;
  }
}

// Run mapping if called directly
if (require.main === module) {
  createTeamNameMapping()
    .then((report) => {
      console.log('\n✨ Phase 3.1 team name mapping completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Phase 3.1 team name mapping failed:', error);
      process.exit(1);
    });
}

module.exports = { createTeamNameMapping };