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

/**
 * Properly parses range references from Excel named ranges
 * This is the key function that makes things work
 */
function parseRangeReference(ref) {
  // Handle format: SheetName!$A$1:$B$5
  const parts = ref.split('!');
  if (parts.length !== 2) return null;
  
  // Get sheet name and range part
  const sheetName = parts[0].replace(/'/g, '');
  const rangePart = parts[1];
  
  // For single cell references
  if (!rangePart.includes(':')) {
    return {
      sheet: sheetName,
      range: rangePart.replace(/\$/g, '')
    };
  }
  
  // For range references
  return {
    sheet: sheetName,
    range: rangePart.replace(/\$/g, '')
  };
}

/**
 * Gets a cell value from a worksheet
 */
function getCellValue(worksheet, cellAddress) {
  const cell = worksheet[cellAddress];
  return cell ? cell.v : null;
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
    
    // Extract metadata from named range
    const metadataRange = workbook.Workbook.Names.find(n => n.Name === 'Growth_Metadata');
    if (metadataRange) {
      const parsedRange = parseRangeReference(metadataRange.Ref);
      if (parsedRange) {
        const ws = workbook.Sheets[parsedRange.sheet];
        
        // Convert to array of rows
        const data = utils.sheet_to_json(ws, { header: 1, range: parsedRange.range });
        
        // Process metadata
        data.forEach(row => {
          if (row && row.length >= 2 && row[0]) {
            growthData.metadata[row[0]] = row[1];
          }
        });
      }
    }
    
    // Extract Top 10 holdings
    const top10Range = workbook.Workbook.Names.find(n => n.Name === 'Growth_Top10');
    if (top10Range) {
      const parsedRange = parseRangeReference(top10Range.Ref);
      if (parsedRange) {
        const ws = workbook.Sheets[parsedRange.sheet];
        
        // Get raw data as an array of objects with headers
        const data = utils.sheet_to_json(ws, { range: parsedRange.range });
        
        // Process into clean format
        data.forEach(item => {
          const entry = {};
          
          // Find the name/security property
          const nameKey = Object.keys(item).find(key => 
            key.toLowerCase().includes("name") || 
            key.toLowerCase().includes("security") || 
            key.toLowerCase().includes("holding"));
          
          // Find the weight property
          const weightKey = Object.keys(item).find(key => 
            key.toLowerCase().includes("weight") || 
            key.toLowerCase().includes("%"));
          
          if (nameKey && weightKey) {
            entry.name = item[nameKey];
            entry.weight = typeof item[weightKey] === 'number' 
              ? formatNumber(item[weightKey]) 
              : item[weightKey];
            
            growthData.top10.push(entry);
          }
        });
      }
    }
    
    // Extract Regional Allocation
    const regionalRange = workbook.Workbook.Names.find(n => n.Name === 'Growth_RegionalAllocation');
    if (regionalRange) {
      const parsedRange = parseRangeReference(regionalRange.Ref);
      if (parsedRange) {
        const ws = workbook.Sheets[parsedRange.sheet];
        
        // Get raw data with headers
        const data = utils.sheet_to_json(ws, { range: parsedRange.range });
        
        // Process into clean format
        data.forEach(item => {
          const entry = {};
          
          // Find the region property
          const regionKey = Object.keys(item).find(key => 
            key.toLowerCase().includes("region"));
          
          // Find the count property
          const countKey = Object.keys(item).find(key => 
            key.toLowerCase().includes("count") || 
            key.toLowerCase().includes("holdings"));
          
          // Find the weight property
          const weightKey = Object.keys(item).find(key => 
            key.toLowerCase().includes("weight") || 
            key.toLowerCase().includes("%"));
          
          if (regionKey) {
            entry.region = item[regionKey];
            
            if (countKey) {
              entry.count = item[countKey];
            }
            
            if (weightKey) {
              entry.weight = typeof item[weightKey] === 'number' 
                ? formatNumber(item[weightKey]) 
                : item[weightKey];
            }
            
            growthData.regionalAllocation.push(entry);
          }
        });
      }
    }
    
    // Extract Metrics as arrays
    const metricLabels = getNamedRangeAsArray(workbook, 'Growth_Metric_Labels');
    const metricPortfolio = getNamedRangeAsArray(workbook, 'Growth_Metric_Portfolio');
    const metricBenchmark = getNamedRangeAsArray(workbook, 'Growth_Metric_Benchmark');
    const metricDifference = getNamedRangeAsArray(workbook, 'Growth_Metric_Difference');
    
    // Combine metrics
    for (let i = 0; i < metricLabels.length; i++) {
      growthData.metrics.push({
        metric: metricLabels[i],
        portfolio: formatNumber(metricPortfolio[i]),
        benchmark: formatNumber(metricBenchmark[i]),
        difference: formatNumber(metricDifference[i])
      });
    }
    
    // Extract Sectors as arrays
    const sectorLabels = getNamedRangeAsArray(workbook, 'Growth_Sector_Labels');
    const sectorTotals = getNamedRangeAsArray(workbook, 'Growth_Sector_Totals');
    
    // Combine sectors
    for (let i = 0; i < sectorLabels.length; i++) {
      growthData.sectors.push({
        sector: sectorLabels[i],
        weight: formatNumber(sectorTotals[i])
      });
    }
    
    // Extract Securities Added
    const addedRange = workbook.Workbook.Names.find(n => n.Name === 'GrowthPositions_SecuritiesAdded');
    if (addedRange) {
      const parsedRange = parseRangeReference(addedRange.Ref);
      if (parsedRange) {
        const ws = workbook.Sheets[parsedRange.sheet];
        
        // For single cell references
        if (!parsedRange.range.includes(':')) {
          const value = getCellValue(ws, parsedRange.range);
          if (value && typeof value === 'string') {
            growthData.securities.added = value
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
          }
        }
      }
    }
    
    // Extract Securities Removed
    const removedRange = workbook.Workbook.Names.find(n => n.Name === 'GrowthPositions_SecuritiesRemoved');
    if (removedRange) {
      const parsedRange = parseRangeReference(removedRange.Ref);
      if (parsedRange) {
        const ws = workbook.Sheets[parsedRange.sheet];
        
        // For single cell references
        if (!parsedRange.range.includes(':')) {
          const value = getCellValue(ws, parsedRange.range);
          if (value && typeof value === 'string') {
            growthData.securities.removed = value
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
          }
        }
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

// Helper function to get array data from a named range
function getNamedRangeAsArray(workbook, rangeName) {
  const range = workbook.Workbook.Names.find(n => n.Name === rangeName);
  if (!range) return [];
  
  const parsedRange = parseRangeReference(range.Ref);
  if (!parsedRange) return [];
  
  const ws = workbook.Sheets[parsedRange.sheet];
  
  // Get the range as a 2D array
  const data = utils.sheet_to_json(ws, { header: 1, range: parsedRange.range });
  
  // Check if it's a single row
  if (data.length === 1) {
    return data[0];
  }
  
  // Check if it's a single column
  if (data.length > 0 && data.every(row => row.length === 1)) {
    return data.map(row => row[0]);
  }
  
  // Otherwise return the first non-empty row
  for (const row of data) {
    if (row.length > 0) {
      return row;
    }
  }
  
  return [];
}

main(); 