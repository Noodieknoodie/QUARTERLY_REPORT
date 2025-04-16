/**
 * Simple test using SheetJS instead of ExcelJS
 */

import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'xlsx';
const { readFile, utils } = pkg;
import fs from 'fs';

// Get current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_FILE = path.join(__dirname, '..', 'data', 'Q1_Report_Input.xlsx');

// Main test function
async function testXlsx() {
  console.log('=== TESTING EXCEL FILE WITH SHEETJS ===\n');
  
  try {
    console.log(`Opening file: ${TEST_FILE}`);
    
    // Read the file
    const workbook = readFile(TEST_FILE);
    
    console.log('✅ Successfully opened workbook!');
    
    // List all sheets
    console.log('\n=== WORKSHEETS ===');
    workbook.SheetNames.forEach(name => {
      console.log(`- ${name}`);
    });
    
    // List all named ranges if available
    console.log('\n=== NAMED RANGES ===');
    if (workbook.Workbook && workbook.Workbook.Names) {
      workbook.Workbook.Names.forEach(name => {
        console.log(`- ${name.Name}: ${name.Ref}`);
      });
    } else {
      console.log('No named ranges found or not supported by SheetJS');
    }
    
    // Read sample data from each sheet
    console.log('\n=== SAMPLE DATA ===');
    workbook.SheetNames.forEach(name => {
      const sheet = workbook.Sheets[name];
      console.log(`\nSheet: ${name}`);
      
      // Convert to JSON for easier access
      const data = utils.sheet_to_json(sheet, { header: 1 });
      
      // Print first few rows
      console.log('First 3 rows:');
      for (let i = 0; i < Math.min(3, data.length); i++) {
        console.log(`  ${JSON.stringify(data[i])}`);
      }
    });
    
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
  }
}

// Run the test
testXlsx(); 