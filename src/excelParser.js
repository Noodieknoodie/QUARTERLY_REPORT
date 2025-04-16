/**
 * Excel Parser for Hohimer Wealth Management Quarterly Reports
 * 
 * Parses Excel workbook and extracts data based on named ranges
 * organized by investment model type.
 */

import pkg from 'xlsx';
const { readFile, utils } = pkg;
import path from 'path';
import fs from 'fs';

// Model types supported
export const MODELS = ['Core', 'Growth', 'SmallMid', 'Alternatives', 'StructuredNotes'];

/**
 * Opens Excel workbook and returns workbook object
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Object>} Excel workbook
 */
export async function openWorkbook(filePath) {
  try {
    const workbook = readFile(filePath);
    return workbook;
  } catch (error) {
    console.error(`Error opening workbook: ${error.message}`);
    throw new Error(`Failed to open Excel workbook: ${error.message}`);
  }
}

/**
 * Gets all defined names in workbook
 * @param {Object} workbook - Excel workbook
 * @returns {Object} Object with name as key and reference as value
 */
function getDefinedNames(workbook) {
  const definedNames = {};
  
  if (workbook.Workbook && workbook.Workbook.Names) {
    workbook.Workbook.Names.forEach(name => {
      definedNames[name.Name] = name.Ref;
    });
  }
  
  return definedNames;
}

/**
 * Extract value from a cell
 * @param {any} value - Cell value
 * @returns {string|number|null} Processed cell value
 */
function extractCellValue(value) {
  if (value === undefined || value === null) return null;
  
  // Handle numeric values - keep decimals only if needed
  if (typeof value === 'number') {
    // If it's a whole number, return as integer
    if (Number.isInteger(value)) {
      return value;
    }
    // Otherwise, format with 1 decimal place
    return parseFloat(value.toFixed(1));
  }
  
  return value;
}

/**
 * Gets range information from a named range reference
 * @param {string} ref - Named range reference (e.g., "Sheet1!$A$1:$B$5")
 * @returns {Object|null} Range information or null if invalid
 */
function parseRangeReference(ref) {
  try {
    // Format: SheetName!$A$1:$B$5
    const parts = ref.split('!');
    if (parts.length !== 2) return null;
    
    const sheetName = parts[0];
    const rangePart = parts[1];
    
    // Handle single cell references
    if (!rangePart.includes(':')) {
      const cellAddress = rangePart.replace(/\$/g, '');
      const cellRef = utils.decode_cell(cellAddress);
      return {
        sheet: sheetName,
        top: cellRef.r,
        left: cellRef.c,
        bottom: cellRef.r,
        right: cellRef.c
      };
    }
    
    // Handle range references
    const [start, end] = rangePart.split(':');
    const startAddress = start.replace(/\$/g, '');
    const endAddress = end.replace(/\$/g, '');
    
    const startRef = utils.decode_cell(startAddress);
    const endRef = utils.decode_cell(endAddress);
    
    return {
      sheet: sheetName,
      top: startRef.r,
      left: startRef.c,
      bottom: endRef.r,
      right: endRef.c
    };
  } catch (error) {
    console.warn(`Could not parse range reference: ${ref}`);
    return null;
  }
}

/**
 * Gets cell value from a worksheet
 * @param {Object} worksheet - Worksheet object
 * @param {number} row - Row index (0-based)
 * @param {number} col - Column index (0-based)
 * @returns {any} Cell value
 */
function getCellValue(worksheet, row, col) {
  const cellAddress = utils.encode_cell({ r: row, c: col });
  const cell = worksheet[cellAddress];
  return cell ? cell.v : null;
}

/**
 * Extracts data for a specific model
 * @param {Object} workbook - Excel workbook
 * @param {string} modelName - Name of investment model (Core, Growth, etc.)
 * @returns {Object} Structured data for the model
 */
export async function extractModelData(workbook, modelName) {
  try {
    const modelData = {
      name: modelName,
      metadata: {},
      commentary: '',
      metrics: {
        portfolio: {},
        benchmark: {},
        difference: {}
      },
      top10: [],
      regionalAllocation: [],
      positions: {
        sectors: {},
        securitiesAdded: [],
        securitiesRemoved: []
      }
    };

    // Get worksheets
    const overviewSheetName = `${modelName.toLowerCase()}_overview`;
    const statsSheetName = `${modelName.toLowerCase()}_stats`;
    const positionsSheetName = `${modelName.toLowerCase()}_positions`;
    
    // Get defined names for this model
    const definedNames = getDefinedNames(workbook);
    
    // Extract metadata (common for all models)
    const metadataName = `${modelName}_Metadata`;
    if (definedNames[metadataName]) {
      const rangeRef = parseRangeReference(definedNames[metadataName]);
      if (rangeRef) {
        const worksheet = workbook.Sheets[rangeRef.sheet];
        for (let row = rangeRef.top; row <= rangeRef.bottom; row++) {
          const label = extractCellValue(getCellValue(worksheet, row, rangeRef.left));
          const value = extractCellValue(getCellValue(worksheet, row, rangeRef.left + 1));
          if (label && value) {
            modelData.metadata[label] = value;
          }
        }
      }
    }

    // Extract commentary
    const commentaryName = `${modelName}_Commentary`;
    if (definedNames[commentaryName]) {
      const rangeRef = parseRangeReference(definedNames[commentaryName]);
      if (rangeRef) {
        const worksheet = workbook.Sheets[rangeRef.sheet];
        const value = getCellValue(worksheet, rangeRef.top, rangeRef.left);
        modelData.commentary = extractCellValue(value) || '';
      }
    }

    // Extract Top 10 holdings
    const top10Name = `${modelName}_Top10`;
    if (definedNames[top10Name]) {
      const rangeRef = parseRangeReference(definedNames[top10Name]);
      if (rangeRef) {
        const worksheet = workbook.Sheets[rangeRef.sheet];
        for (let row = rangeRef.top; row <= rangeRef.bottom; row++) {
          const name = extractCellValue(getCellValue(worksheet, row, rangeRef.left));
          const weight = extractCellValue(getCellValue(worksheet, row, rangeRef.left + 1));
          if (name && weight !== null) {
            modelData.top10.push({ name, weight });
          }
        }
      }
    }

    // Extract Regional Allocation
    const regionName = `${modelName}_RegionalAllocation`;
    if (definedNames[regionName]) {
      const rangeRef = parseRangeReference(definedNames[regionName]);
      if (rangeRef) {
        const worksheet = workbook.Sheets[rangeRef.sheet];
        for (let row = rangeRef.top; row <= rangeRef.bottom; row++) {
          const region = extractCellValue(getCellValue(worksheet, row, rangeRef.left));
          const holdings = extractCellValue(getCellValue(worksheet, row, rangeRef.left + 1));
          const weight = extractCellValue(getCellValue(worksheet, row, rangeRef.left + 2));
          if (region) {
            modelData.regionalAllocation.push({ region, holdings, weight });
          }
        }
      }
    }

    // Extract Metrics
    const metricLabelsName = `${modelName}_Metric_Labels`;
    const metricPortfolioName = `${modelName}_Metric_Portfolio`;
    const metricBenchmarkName = `${modelName}_Metric_Benchmark`;
    const metricDifferenceName = `${modelName}_Metric_Difference`;

    if (definedNames[metricLabelsName]) {
      const labelsRangeRef = parseRangeReference(definedNames[metricLabelsName]);
      const portfolioRangeRef = definedNames[metricPortfolioName] ? parseRangeReference(definedNames[metricPortfolioName]) : null;
      const benchmarkRangeRef = definedNames[metricBenchmarkName] ? parseRangeReference(definedNames[metricBenchmarkName]) : null;
      const differenceRangeRef = definedNames[metricDifferenceName] ? parseRangeReference(definedNames[metricDifferenceName]) : null;

      if (labelsRangeRef) {
        const labelsWorksheet = workbook.Sheets[labelsRangeRef.sheet];
        for (let row = labelsRangeRef.top; row <= labelsRangeRef.bottom; row++) {
          const label = extractCellValue(getCellValue(labelsWorksheet, row, labelsRangeRef.left));
          
          if (label) {
            if (portfolioRangeRef) {
              const portfolioWorksheet = workbook.Sheets[portfolioRangeRef.sheet];
              const portfolioRow = row - labelsRangeRef.top + portfolioRangeRef.top;
              modelData.metrics.portfolio[label] = extractCellValue(
                getCellValue(portfolioWorksheet, portfolioRow, portfolioRangeRef.left)
              );
            }
            
            if (benchmarkRangeRef) {
              const benchmarkWorksheet = workbook.Sheets[benchmarkRangeRef.sheet];
              const benchmarkRow = row - labelsRangeRef.top + benchmarkRangeRef.top;
              modelData.metrics.benchmark[label] = extractCellValue(
                getCellValue(benchmarkWorksheet, benchmarkRow, benchmarkRangeRef.left)
              );
            }
            
            if (differenceRangeRef) {
              const differenceWorksheet = workbook.Sheets[differenceRangeRef.sheet];
              const differenceRow = row - labelsRangeRef.top + differenceRangeRef.top;
              modelData.metrics.difference[label] = extractCellValue(
                getCellValue(differenceWorksheet, differenceRow, differenceRangeRef.left)
              );
            }
          }
        }
      }
    }

    // Extract Positions data (not applicable to SmallMid)
    if (modelName !== 'SmallMid' && workbook.SheetNames.includes(positionsSheetName)) {
      // Extract sector labels and totals
      const sectorLabelsName = `${modelName}_Sector_Labels`;
      const sectorTotalsName = `${modelName}_Sector_Totals`;
      
      if (definedNames[sectorLabelsName] && definedNames[sectorTotalsName]) {
        const labelsRangeRef = parseRangeReference(definedNames[sectorLabelsName]);
        const totalsRangeRef = parseRangeReference(definedNames[sectorTotalsName]);
        
        if (labelsRangeRef && totalsRangeRef) {
          const labelsWorksheet = workbook.Sheets[labelsRangeRef.sheet];
          const totalsWorksheet = workbook.Sheets[totalsRangeRef.sheet];
          
          for (let row = labelsRangeRef.top; row <= labelsRangeRef.bottom; row++) {
            const label = extractCellValue(getCellValue(labelsWorksheet, row, labelsRangeRef.left));
            const totalRow = row - labelsRangeRef.top + totalsRangeRef.top;
            const total = extractCellValue(getCellValue(totalsWorksheet, totalRow, totalsRangeRef.left));
            
            if (label && total !== null) {
              modelData.positions.sectors[label] = total;
            }
          }
        }
      }
      
      // Extract securities added/removed
      const securitiesAddedName = `${modelName}Positions_SecuritiesAdded`;
      const securitiesRemovedName = `${modelName}Positions_SecuritiesRemoved`;
      
      if (definedNames[securitiesAddedName]) {
        const addedRangeRef = parseRangeReference(definedNames[securitiesAddedName]);
        if (addedRangeRef) {
          const worksheet = workbook.Sheets[addedRangeRef.sheet];
          const addedValue = getCellValue(worksheet, addedRangeRef.top, addedRangeRef.left);
          
          if (addedValue && typeof addedValue === 'string') {
            modelData.positions.securitiesAdded = addedValue.split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0);
          }
        }
      }
      
      if (definedNames[securitiesRemovedName]) {
        const removedRangeRef = parseRangeReference(definedNames[securitiesRemovedName]);
        if (removedRangeRef) {
          const worksheet = workbook.Sheets[removedRangeRef.sheet];
          const removedValue = getCellValue(worksheet, removedRangeRef.top, removedRangeRef.left);
          
          if (removedValue && typeof removedValue === 'string') {
            modelData.positions.securitiesRemoved = removedValue.split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0);
          }
        }
      }
    }

    return modelData;
    
  } catch (error) {
    console.error(`Error extracting data for model ${modelName}: ${error.message}`);
    throw new Error(`Failed to extract data for model ${modelName}: ${error.message}`);
  }
}

/**
 * Extract data from Excel workbook for all models
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Object>} Object with model name as key and model data as value
 */
export async function parseWorkbook(filePath) {
  try {
    const workbook = await openWorkbook(filePath);
    
    // Extract data for each model
    const modelData = {};
    
    // Process only models with sheets actually present in the workbook
    const sheetNames = workbook.SheetNames;
    const availableModels = MODELS.filter(model => 
      sheetNames.includes(`${model.toLowerCase()}_overview`) || 
      sheetNames.includes(`${model.toLowerCase()}_stats`)
    );
    
    // Use Promise.all to process models in parallel for better performance
    const modelPromises = availableModels.map(async model => {
      return { model, data: await extractModelData(workbook, model) };
    });
    
    const results = await Promise.all(modelPromises);
    
    // Convert array of results to object
    results.forEach(({ model, data }) => {
      modelData[model] = data;
    });
    
    return modelData;
  } catch (error) {
    console.error(`Error parsing workbook: ${error.message}`);
    throw new Error(`Failed to parse workbook: ${error.message}`);
  }
}

// Default export for backward compatibility
export default {
  parseWorkbook,
  extractModelData,
  openWorkbook,
  MODELS
};
