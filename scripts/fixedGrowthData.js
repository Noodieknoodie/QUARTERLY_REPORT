#!/usr/bin/env node

import pkg from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

const { readFile, utils } = pkg;
const EXCEL_FILE_PATH = path.resolve('data/Q1_Report_Input.xlsx');
const OUTPUT_FILE_PATH = path.resolve('output/growth_data.json');

function formatNumber(value) {
  if (typeof value !== 'number') return value;
  return Number.isInteger(value) ? value : value.toFixed(1);
}

// Get data from worksheet for a specific named range
function getNamedRangeData(workbook, rangeName) {
  // Find the named range
  const range = workbook.Workbook.Names.find(n => n.Name === rangeName);
  if (!range) {
    console.log(`Named range not found: ${rangeName}`);
    return null;
  }
  
  // Get the reference string
  const refString = range.Ref;
  console.log(`Found reference for ${rangeName}: ${refString}`);
  
  // Handle Table references - directly use the table name to find the worksheet
  if (refString.includes('Table')) {
    if (refString.includes('[') && refString.includes(']')) {
      // Extract table name and column name
      const matches = refString.match(/Table(\d+)\[(.*?)\]/);
      if (matches && matches.length >= 3) {
        const tableNum = matches[1];
        const colName = matches[2];
        
        // Find table reference from the list of ranges
        const tableName = `Table${tableNum}`;
        const tableRange = workbook.Workbook.Names.find(n => n.Name === tableName);
        
        if (tableRange) {
          const [sheetName, tableRef] = tableRange.Ref.split('!');
          const worksheet = workbook.Sheets[sheetName.replace(/'/g, '')];
          
          // Get all data from the table
          const tableData = utils.sheet_to_json(worksheet, { 
            range: tableRef.replace(/\$/g, ''),
            header: 1
          });
          
          // Find the column index from the header row
          if (tableData.length > 0) {
            const headerRow = tableData[0];
            const colIndex = headerRow.findIndex(h => 
              h && h.toString().toLowerCase() === colName.toLowerCase()
            );
            
            if (colIndex >= 0) {
              // Extract just that column's data
              return tableData.slice(1).map(row => row[colIndex]);
            }
          }
        }
      }
    } else {
      // Handle reference to whole table
      // For example: Growth_RegionalAllocation: Table2
      const tableNum = refString.match(/Table(\d+)/)[1];
      const tableName = `Table${tableNum}`;
      
      // Find the table's cell range
      const tableRange = workbook.Workbook.Names.find(n => n.Name === tableName);
      
      if (tableRange) {
        const [sheetName, tableRef] = tableRange.Ref.split('!');
        const worksheet = workbook.Sheets[sheetName.replace(/'/g, '')];
        
        // Read raw data without headers
        return utils.sheet_to_json(worksheet, { 
          range: tableRef.replace(/\$/g, ''),
          header: 1
        });
      }
    }
  } else {
    // It's a standard cell range
    const [sheetName, cellRange] = refString.split('!');
    const worksheet = workbook.Sheets[sheetName.replace(/'/g, '')];
    
    // Handle single cell reference
    if (!cellRange.includes(':')) {
      const addr = cellRange.replace(/\$/g, '');
      const cell = worksheet[addr];
      return cell ? cell.v : null;
    }
    
    // Handle range of cells
    return utils.sheet_to_json(worksheet, { 
      range: cellRange.replace(/\$/g, ''),
      header: 1
    });
  }
  
  return null;
}

// Get a specific column from a table by name
function getColumnFromTable(tableData, columnName) {
  if (!tableData || !tableData.length) return [];
  
  return tableData.map(row => {
    // Handle case sensitivity by looking for the right key
    const matchingKey = Object.keys(row).find(
      key => key.toLowerCase() === columnName.toLowerCase()
    );
    
    return matchingKey ? row[matchingKey] : null;
  }).filter(Boolean);
}

async function main() {
  try {
    console.log(`Opening file: ${EXCEL_FILE_PATH}`);
    const workbook = readFile(EXCEL_FILE_PATH, { cellDates: true });
    console.log('✅ Successfully opened workbook!');
    
    // Create the output structure
    const growthData = {
      model: "Growth",
      metadata: {},
      top10: [],
      metrics: [],
      sectors: [],
      regionalAllocation: [],
      securities: { added: [], removed: [] }
    };
    
    // Extract metadata
    const metadataRange = workbook.Workbook.Names.find(n => n.Name === 'Growth_Metadata');
    if (metadataRange) {
      const [sheet, cellRange] = metadataRange.Ref.split('!');
      const worksheet = workbook.Sheets[sheet.replace(/'/g, '')];
      const data = utils.sheet_to_json(worksheet, { header: 1, range: cellRange.replace(/\$/g, '') });
      
      data.forEach(row => {
        if (row && row.length >= 2 && row[0]) {
          growthData.metadata[row[0]] = row[1];
        }
      });
    }
    
    // Get data from Table3 for Top10
    const top10Range = workbook.Workbook.Names.find(n => n.Name === 'Table3');
    if (top10Range) {
      const [sheet, cellRange] = top10Range.Ref.split('!');
      const worksheet = workbook.Sheets[sheet.replace(/'/g, '')];
      const rawData = utils.sheet_to_json(worksheet, { header: 1, range: cellRange.replace(/\$/g, '') });
      
      // Skip header row and process data in groups of 3
      // Assuming format: Rank, Name, Weight
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length >= 3) {
          growthData.top10.push({
            rank: row[0],
            name: row[1],
            weight: formatNumber(row[2])
          });
        }
      }
    }
    
    // Get data from Table2 for Regional Allocation
    const regionalRange = workbook.Workbook.Names.find(n => n.Name === 'Table2');
    if (regionalRange) {
      const [sheet, cellRange] = regionalRange.Ref.split('!');
      const worksheet = workbook.Sheets[sheet.replace(/'/g, '')];
      const rawData = utils.sheet_to_json(worksheet, { header: 1, range: cellRange.replace(/\$/g, '') });
      
      // Skip header row (if present)
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length >= 3) {
          // Check if it's a valid region (not a header)
          if (typeof row[0] === 'string' && row[0] !== 'Region') {
            growthData.regionalAllocation.push({
              region: row[0],
              count: row[1],
              weight: formatNumber(row[2])
            });
          }
        }
      }
    }
    
    // Get data from Table4 for Metrics
    const metricsRange = workbook.Workbook.Names.find(n => n.Name === 'Table4');
    if (metricsRange) {
      const [sheet, cellRange] = metricsRange.Ref.split('!');
      const worksheet = workbook.Sheets[sheet.replace(/'/g, '')];
      const rawData = utils.sheet_to_json(worksheet, { header: 1, range: cellRange.replace(/\$/g, '') });
      
      // Process metrics data
      // Format is: Label, Portfolio, Benchmark, Difference
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length >= 4 && row[0] && row[0] !== 'Metric') {
          growthData.metrics.push({
            metric: row[0],
            portfolio: formatNumber(row[1]),
            benchmark: formatNumber(row[2]),
            difference: formatNumber(row[3])
          });
        }
      }
    }
    
    // Get data from Table51012 for Sectors
    const sectorsRange = workbook.Workbook.Names.find(n => n.Name === 'Table51012');
    if (sectorsRange) {
      const [sheet, cellRange] = sectorsRange.Ref.split('!');
      const worksheet = workbook.Sheets[sheet.replace(/'/g, '')];
      const rawData = utils.sheet_to_json(worksheet, { header: 1, range: cellRange.replace(/\$/g, '') });
      
      // Process sector data - looking for sector name and weight
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length >= 4) {
          // Check if it's a sector row
          if (typeof row[0] === 'string' && row[0] && row[0] !== 'Sector Totals' && row[0] !== ',') {
            // The weight is in column 3 (New Total)
            growthData.sectors.push({
              sector: row[0],
              weight: row[3] // This is the "New Total" column
            });
          }
        }
      }
    }
    
    // Extract Securities Added/Removed (these are standard cell references)
    const addedRange = workbook.Workbook.Names.find(n => n.Name === 'GrowthPositions_SecuritiesAdded');
    if (addedRange) {
      const [sheet, cellRef] = addedRange.Ref.split('!');
      const worksheet = workbook.Sheets[sheet.replace(/'/g, '')];
      const cell = cellRef.replace(/\$/g, '');
      const value = worksheet[cell]?.v;
      
      if (value && typeof value === 'string') {
        growthData.securities.added = value
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }
    
    const removedRange = workbook.Workbook.Names.find(n => n.Name === 'GrowthPositions_SecuritiesRemoved');
    if (removedRange) {
      const [sheet, cellRef] = removedRange.Ref.split('!');
      const worksheet = workbook.Sheets[sheet.replace(/'/g, '')];
      const cell = cellRef.replace(/\$/g, '');
      const value = worksheet[cell]?.v;
      
      if (value && typeof value === 'string') {
        growthData.securities.removed = value
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }
    
    // Write to output file
    await fs.writeFile(
      OUTPUT_FILE_PATH,
      JSON.stringify(growthData, null, 2)
    );
    
    console.log(`\n✅ Growth data successfully written to ${OUTPUT_FILE_PATH}`);
    
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    console.error(error.stack);
  }
}

main(); 