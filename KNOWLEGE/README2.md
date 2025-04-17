# Hohimer Wealth Management Quarterly Report Generator

## Project Overview
This system generates structured quarterly investment reports for Hohimer Wealth Management based on data from Excel workbooks. The reports cover five different investment models, presenting key metrics, holdings, and performance data in a clean, consistent PDF format.

## BUILDING
- **Phase 1 (Excel Parsing)**:
- **Phase 2 (Templates)**: 
- **Phase 3 (PDF Generation)**: 
- **Phase 4 (Integration)**: 

## Investment Models
The system generates reports for five investment models:
- Core
- Growth
- Small-Mid
- Alternatives
- Structured Notes

## Data Source
- Excel workbook (`data/Q1_Report_Input.xlsx`)
- Each model has dedicated worksheets with named ranges
- Format is semi-structured with predictable ranges but variable content

## Project Structure
```
hohimer-report-generator/
  ├── src/
  │   ├── index.js             # Main entry point
  │   ├── excelParser.js       # Excel data extraction
  │   ├── templates/           # Handlebars templates 
  │   └── styles/              # CSS styles for report
  ├── data/
  │   └── Q1_Report_Input.xlsx # Input Excel data
  ├── output/                  # Generated reports
  ├── tests/                   # Test files
  ├── LLM_README/              # Documentation for AI assistants
  └── README.md
```

## Technology Stack
- **Node.js** (v18+): Runtime environment
- **SheetJS (xlsx)**: Excel parsing library
- **Handlebars**: Templating engine (to be implemented)
- **Puppeteer**: PDF generation (to be implemented)
- **Jest**: Testing framework

## Excel Data Structure
Each model follows a similar structure with named ranges:

### [model]_overview Worksheet
- **[Model]_Metadata**: Two-column table with labels (As Of Date, Portfolio, etc.)
- **[Model]_Commentary**: Descriptive text about the model (2-3 paragraphs)

### [model]_stats Worksheet
- **[Model]_Top10**: Ranked top 10 holdings with Name and Weight (%)
- **[Model]_RegionalAllocation**: Regions with Holdings count and Weight (%)
- **[Model]_Metric_Labels**: Metric identifiers (Div Yld, P/E, etc.)
- **[Model]_Metric_Portfolio**: Portfolio values for metrics
- **[Model]_Metric_Benchmark**: Benchmark values for metrics
- **[Model]_Metric_Difference**: Numeric differences (Portfolio - Benchmark)

### [model]_positions Worksheet (Core & Growth only)
- **[Model]_Sector_Labels**: Sector labels (Financials, Healthcare, etc.)
- **[Model]_Sector_Totals**: Sector allocation percentages
- **[Model]Positions_SecuritiesAdded**: Comma-delimited securities added
- **[Model]Positions_SecuritiesRemoved**: Comma-delimited securities removed

## Implementation Details

### Currently Implemented
- Excel parsing using SheetJS (xlsx)
- Data extraction from all named ranges
- Decimal formatting (only show 1 decimal place when needed)
- Error handling for missing ranges/sheets
- Testing infrastructure with Jest

### Next Implementation Steps
1. Create Handlebars templates for report layout
2. Implement PDF generation with Puppeteer
3. Add report generator to combine data with templates

## Running the Project

### Installation
```bash
npm install
```

### Running Tests
```bash
npm test
```

### Running the Report Generator
```bash
npm start
```

## Special Notes
- The Excel parser uses SheetJS instead of ExcelJS due to compatibility issues
- Named ranges are critical for the Excel structure
- All calculations are handled externally; this system is for report generation only

## Output Format
- Multi-page PDF
- Cover page, index, and 1-2 pages per model
- Consistent header and footer with disclosures
- Clean, professional layout
