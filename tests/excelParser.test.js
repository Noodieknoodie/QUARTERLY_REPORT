import path from 'path';
import { fileURLToPath } from 'url';
import { parseWorkbook, openWorkbook, MODELS } from '../src/excelParser.js';

// Get current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_FILE = path.join(__dirname, '..', 'data', 'Q1_Report_Input.xlsx');

describe('Excel Parser', () => {
  test('Can open workbook', async () => {
    const workbook = await openWorkbook(TEST_FILE);
    expect(workbook).toBeDefined();
    expect(workbook.SheetNames.length).toBeGreaterThan(0);
  });

  test('Can extract model data', async () => {
    const modelData = await parseWorkbook(TEST_FILE);
    expect(modelData).toBeDefined();
    expect(Object.keys(modelData).length).toBeGreaterThan(0);
    
    // Test a model's structure if it exists
    const firstModel = Object.keys(modelData)[0];
    if (firstModel) {
      const data = modelData[firstModel];
      expect(data.metadata).toBeDefined();
      expect(data.top10).toBeInstanceOf(Array);
      expect(data.metrics).toBeDefined();
    }
  });
  
  test('Correctly formats decimal values', async () => {
    const modelData = await parseWorkbook(TEST_FILE);
    const firstModel = Object.keys(modelData)[0];
    
    if (firstModel) {
      // Check Top 10 weights formatting (should have at most 1 decimal place)
      modelData[firstModel].top10.forEach(holding => {
        if (typeof holding.weight === 'number') {
          // If it's not an integer, it should have exactly 1 decimal place
          if (!Number.isInteger(holding.weight)) {
            const decimalPart = holding.weight.toString().split('.')[1];
            expect(decimalPart.length).toBe(1);
          }
        }
      });
    }
  });

  test('Debug Excel file structure', async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(TEST_FILE);
      
      // Log all worksheets and their tables
      console.log("=== EXCEL FILE STRUCTURE ===");
      workbook.worksheets.forEach(worksheet => {
        console.log(`\nSheet: ${worksheet.name}`);
        
        // Check for tables
        if (worksheet.tables && Object.keys(worksheet.tables).length > 0) {
          console.log("  Tables:");
          Object.entries(worksheet.tables).forEach(([name, table]) => {
            console.log(`    - ${name} (has filter buttons: ${!!table.filterButton})`);
          });
        }
        
        // Check for autofilters
        if (worksheet.autoFilter) {
          console.log(`  Has AutoFilter: ${JSON.stringify(worksheet.autoFilter)}`);
        }
      });
      
    } catch (error) {
      // Catch the error and log detailed information
      console.log("=== ERROR DETAILS ===");
      console.log(`Error message: ${error.message}`);
      console.log(`Error occurs at: ${error.stack.split('\n')[1]}`);
      
      if (error.message.includes('filterButton')) {
        console.log("\nThis is likely caused by Excel tables with filter buttons enabled.");
        console.log("Try opening the Excel file and disabling filter buttons on all tables.");
      }
    }
  });
});