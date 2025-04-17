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
    
    // 1. EXTRACT METADATA - Normal cell range
    const overviewSheet = workbook.Sheets['growth_overview'];
    if (overviewSheet) {
      // Extract metadata from B7:C11
      for (let i = 7; i <= 11; i++) {
        const labelCell = overviewSheet[`B${i}`];
        const valueCell = overviewSheet[`C${i}`];
        if (labelCell && valueCell) {
          growthData.metadata[labelCell.v] = valueCell.v;
        }
      }
    }
    
    // 2. EXTRACT TOP 10 - Direct from growth_stats sheet
    const statsSheet = workbook.Sheets['growth_stats'];
    if (statsSheet) {
      // Top 10 holdings in B7:D16 (based on Table3 location)
      for (let i = 7; i <= 16; i++) {
        const rankCell = statsSheet[`B${i}`];
        const nameCell = statsSheet[`C${i}`];
        const weightCell = statsSheet[`D${i}`];
        
        if (rankCell && nameCell && weightCell) {
          growthData.top10.push({
            rank: rankCell.v,
            name: nameCell.v,
            weight: formatNumber(weightCell.v)
          });
        }
      }
      
      // Regional allocation in B20:D24 (based on Table2 location)
      for (let i = 20; i <= 24; i++) {
        const regionCell = statsSheet[`B${i}`];
        const countCell = statsSheet[`C${i}`];
        const weightCell = statsSheet[`D${i}`];
        
        if (regionCell && regionCell.v && regionCell.v !== 'Region') {
          growthData.regionalAllocation.push({
            region: regionCell.v,
            count: countCell ? countCell.v : null,
            weight: weightCell ? formatNumber(weightCell.v) : null
          });
        }
      }
      
      // Metrics in B29:E37 (based on Table4 location)
      for (let i = 30; i <= 37; i++) {  // Start at 30 to skip header
        const metricCell = statsSheet[`B${i}`];
        const portfolioCell = statsSheet[`C${i}`];
        const benchmarkCell = statsSheet[`D${i}`];
        const differenceCell = statsSheet[`E${i}`];
        
        if (metricCell && metricCell.v) {
          growthData.metrics.push({
            metric: metricCell.v,
            portfolio: portfolioCell ? formatNumber(portfolioCell.v) : null,
            benchmark: benchmarkCell ? formatNumber(benchmarkCell.v) : null,
            difference: differenceCell ? formatNumber(differenceCell.v) : null
          });
        }
      }
    }
    
    // 3. EXTRACT SECTORS - Direct from growth_positions sheet
    const positionsSheet = workbook.Sheets['growth_positions'];
    if (positionsSheet) {
      // Sectors in B5:G15 (based on Table51012 location)
      for (let i = 6; i <= 15; i++) {  // Start at 6 to skip header
        const sectorCell = positionsSheet[`B${i}`];
        const weightCell = positionsSheet[`E${i}`];  // New Total column
        
        if (sectorCell && sectorCell.v && typeof sectorCell.v === 'string' && 
            sectorCell.v !== ',' && sectorCell.v !== 'Sector Totals') {
          growthData.sectors.push({
            sector: sectorCell.v,
            weight: weightCell ? weightCell.v : null
          });
        }
      }
      
      // Securities added and removed
      const addedCell = positionsSheet['C18'];
      const removedCell = positionsSheet['C20'];
      
      if (addedCell && addedCell.v) {
        growthData.securities.added = addedCell.v
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      
      if (removedCell && removedCell.v) {
        growthData.securities.removed = removedCell.v
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