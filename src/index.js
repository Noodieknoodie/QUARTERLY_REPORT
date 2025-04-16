/**
 * Main entry point for Hohimer Wealth Management Quarterly Report Generator
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseWorkbook } from './excelParser.js';

// Get current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const DEFAULT_EXCEL_FILE = path.join(DATA_DIR, 'Q1_Report_Input.xlsx');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Main function to generate report
 * @param {string} excelFilePath - Path to Excel file
 * @returns {Promise<Object>} Extracted model data
 */
export async function main(excelFilePath = DEFAULT_EXCEL_FILE) {
  try {
    console.log(`Parsing Excel workbook: ${excelFilePath}`);
    
    // Parse Excel workbook
    const modelData = await parseWorkbook(excelFilePath);
    
    // Output data to JSON file for verification
    const outputFile = path.join(OUTPUT_DIR, 'extracted_data.json');
    fs.writeFileSync(outputFile, JSON.stringify(modelData, null, 2));
    
    console.log(`Successfully extracted data from ${Object.keys(modelData).length} models`);
    console.log(`Data saved to ${outputFile}`);
    
    // Log models found
    console.log('\nModels found:');
    Object.keys(modelData).forEach(model => {
      const data = modelData[model];
      console.log(`- ${model}`);
      console.log(`  Metadata: ${Object.keys(data.metadata).length} fields`);
      console.log(`  Top 10 Holdings: ${data.top10.length} items`);
      console.log(`  Regional Allocation: ${data.regionalAllocation.length} regions`);
      console.log(`  Metrics: ${Object.keys(data.metrics.portfolio).length} metrics`);
      
      if (model !== 'SmallMid') {
        console.log(`  Sectors: ${Object.keys(data.positions.sectors).length} sectors`);
        console.log(`  Securities Added: ${data.positions.securitiesAdded.length} securities`);
        console.log(`  Securities Removed: ${data.positions.securitiesRemoved.length} securities`);
      }
      console.log('');
    });
    
    return modelData;
  } catch (error) {
    console.error(`Error generating report: ${error.message}`);
    process.exit(1);
  }
}

// Run main function if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export default main;
