/**
 * Standalone test for Excel named ranges
 * Tests each named range separately without stopping on errors
 */

import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

// Get current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_FILE = path.join(__dirname, '..', 'data', 'Q1_Report_Input.xlsx');

// List of named ranges to test for Growth model
const GROWTH_NAMED_RANGES = [
  'Growth_Metadata',
  'Growth_Commentary',
  'Growth_Top10',
  'Growth_RegionalAllocation',
  'Growth_Metric_Labels',
  'Growth_Metric_Portfolio', 
  'Growth_Metric_Benchmark',
  'Growth_Metric_Difference',
  'Growth_Sector_Labels',
  'Growth_Sector_Totals',
  'GrowthPositions_SecuritiesAdded',
  'GrowthPositions_SecuritiesRemoved'
];

// Helper function to safely access cell value
function safeGetCellValue(sheet, row, col) {
  try {
    return sheet.getCell(row, col).value;
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

async function testNamedRanges() {
  console.log('=== TESTING NAMED RANGES FOR GROWTH MODEL ===\n');
  
  try {
    // Open the workbook
    console.log('Opening workbook...');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEST_FILE);
    console.log('Workbook opened successfully!\n');
    
    // Get all defined names in workbook
    const definedNames = {};
    workbook.definedNames.forEach(name => {
      definedNames[name.name] = name.refersTo;
    });
    
    console.log('=== ALL DEFINED NAMES IN WORKBOOK ===');
    Object.keys(definedNames).forEach(name => {
      console.log(`${name}: ${definedNames[name]}`);
    });
    console.log('\n');
    
    // Test each named range individually
    console.log('=== TESTING EACH NAMED RANGE ===');
    for (const rangeName of GROWTH_NAMED_RANGES) {
      try {
        console.log(`\nTesting ${rangeName}...`);
        
        // Check if the named range exists
        if (!definedNames[rangeName]) {
          console.log(`  ❌ Named range "${rangeName}" does not exist!`);
          continue;
        }
        
        // Get range information
        const ranges = workbook.definedNames.getRanges(rangeName);
        if (!ranges || ranges.length === 0) {
          console.log(`  ❌ Could not get range for "${rangeName}"`);
          continue;
        }
        
        // Log range details
        const range = ranges[0];
        console.log(`  ✓ Found range: Sheet "${range.sheet}", From ${range.top},${range.left} to ${range.bottom},${range.right}`);
        
        // Test accessing the worksheet
        const worksheet = workbook.getWorksheet(range.sheet);
        if (!worksheet) {
          console.log(`  ❌ Could not find worksheet "${range.sheet}"`);
          continue;
        }
        console.log(`  ✓ Found worksheet "${worksheet.name}"`);
        
        // Try to read some cells from the range
        console.log(`  ✓ Sample values from range:`);
        for (let row = range.top; row <= Math.min(range.top + 2, range.bottom); row++) {
          for (let col = range.left; col <= Math.min(range.left + 2, range.right); col++) {
            const value = safeGetCellValue(worksheet, row, col);
            console.log(`    Cell (${row},${col}): ${value}`);
          }
        }
        
        console.log(`  ✅ Successfully accessed "${rangeName}"`);
      } catch (error) {
        console.log(`  ❌ Error testing "${rangeName}": ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
  }
}

// Run the test
testNamedRanges().catch(err => console.error(`Unhandled error: ${err.message}`)); 