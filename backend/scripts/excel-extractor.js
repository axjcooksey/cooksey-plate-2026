/**
 * Phase 1: Excel Extractor
 * Extracts raw data from Cooksey Plate Excel file
 * Outputs: JSON files for each tab with structured data
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_FILE_PATH = '../reference/Cooksey Plate 2025 (2).xlsx';
const OUTPUT_DIR = '../export/phase1-raw';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function extractExcelData() {
  console.log('📊 Starting Excel extraction...');
  
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    console.log(`📁 Found ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);
    
    const extractedData = {};
    
    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      console.log(`\n🔍 Processing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with full range
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Use array of arrays format
        defval: '', // Default value for empty cells
        raw: false // Get formatted values
      });
      
      // Extract week number from sheet name
      let weekNumber;
      if (sheetName === 'Overview') {
        weekNumber = 23; // Current week
      } else if (sheetName.startsWith('Week ')) {
        weekNumber = parseInt(sheetName.replace('Week ', ''));
      }
      
      const sheetData = {
        sheetName,
        weekNumber,
        rawData: jsonData,
        extractedAt: new Date().toISOString(),
        totalRows: jsonData.length,
        totalColumns: jsonData[0] ? jsonData[0].length : 0
      };
      
      extractedData[sheetName] = sheetData;
      
      // Write individual sheet data to file
      const filename = `${sheetName.replace(' ', '_').toLowerCase()}.json`;
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(sheetData, null, 2));
      
      console.log(`  ✅ Extracted ${jsonData.length} rows × ${sheetData.totalColumns} columns`);
      console.log(`  💾 Saved to: ${filename}`);
    });
    
    // Write combined summary file
    const summaryFile = path.join(OUTPUT_DIR, 'extraction-summary.json');
    const summary = {
      totalSheets: workbook.SheetNames.length,
      sheets: Object.keys(extractedData).map(key => ({
        name: key,
        weekNumber: extractedData[key].weekNumber,
        rows: extractedData[key].totalRows,
        columns: extractedData[key].totalColumns
      })),
      extractedAt: new Date().toISOString(),
      sourceFile: EXCEL_FILE_PATH
    };
    
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log('\n🎉 Extraction complete!');
    console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
    console.log(`📋 Summary saved to: extraction-summary.json`);
    
    return extractedData;
    
  } catch (error) {
    console.error('❌ Error during extraction:', error);
    throw error;
  }
}

// Run extraction if called directly
if (require.main === module) {
  try {
    extractExcelData();
    console.log('\n✨ Phase 1 extraction completed successfully!');
  } catch (error) {
    console.error('\n💥 Phase 1 extraction failed:', error);
    process.exit(1);
  }
}

module.exports = { extractExcelData };