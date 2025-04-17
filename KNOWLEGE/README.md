# Quarterly Investment Model Report — Hohimer Wealth Management
This system generates a clean, structured quarterly report for Hohimer Wealth Management’s investment models. The report is sourced from a designated Excel workbook containing semi-structured worksheets—one per model—with predictable value ranges. Data may vary quarter to quarter (e.g., securities added/removed), but structure remains consistent. All calculations are handled externally; this process is focused purely on report generation.
Investment models:
    • Core
    • Growth
    • Small-Mid
    • Alternatives
    • Structured Notes
Output:
    • Multi-page PDF
    • Includes cover page, index, and one to two pages per model
    • Consistent header and footer with required disclosures
    • Layout prioritizes clarity and intelligent use of space without overdesign
This serves as the foundation for scalable, repeatable quarterly reporting.
---
# DATA:
"C:\Users\ErikKnudsen\OneDrive - Hohimer Wealth Management\Documents\_WORK_PROJECTS\Q_REPORT\data\Q1_Report_Input.xlsx"
---
# FILE PATHS
hohimer-report-generator/
  ├── src/
  │   ├── index.js
  │   ├── excelParser.js
  │   ├── reportGenerator.js
  │   ├── templates/
  │   │   ├── report.hbs
  │   │   ├── _partials/
  │   │   │   ├── header.html
  │   │   │   ├── footer.html
  │   │   │   ├── coverPage.hbs
  │   │   │   ├── indexPage.hbs
  │   │   │   ├── capitalMarketsRecap.hbs
  │   │   │   ├── modelPage-Core.hbs
  │   │   │   ├── modelPage-Growth.hbs
  │   │   │   ├── modelPage-SmallMid.hbs
  │   │   │   ├── modelPage-Alternatives.hbs
  │   │   │   └── modelPage-StructuredNotes.hbs
  │   └── styles/
  │       └── print.css
  ├── data/
  │   └── Q1_Report_Input.xlsx   
  ├── output/                    
  ├── public/
  │   └── images/
  │       └── logo.png
  ├── package.json
  ├── .gitignore
  └── README.md
---
Models: Growth and Core 

These models share the same layout and data mapping. 

Worksheets: growth_overview, growth_positions, growth_stats, core_overview, core_positions, core_stats, smid_overview, smid_stats.

Named Ranges per Model (replace [Model] with "Growth", "Core", or "Smid"):

Worksheet: [model]_overview
- [Model]_Metadata:
  Two-column table with Labels (As Of Date, Portfolio, Classification, Currency, Benchmark) and corresponding values.
- [Model]_Commentary: evergreen text for each model. basically a static description. its about 2-3 short paragraphs in length per model. All within a single cell, yet still named for consistency.

Worksheet: [model]_stats
- [Model]_Top10: Ranked top 10 holdings with Name and Weight (%).
- [Model]_RegionalAllocation: Regions with Holdings count and Weight (%).
- Metrics Section (aligned ranges):
  - [Model]_Metric_Labels: Metrics identifiers (Div Yld, P/E, P/CF, P/B, Debt/Equity).
  - [Model]_Metric_Portfolio: Metric values for Portfolio.
  - [Model]_Metric_Benchmark: Metric values for Benchmark.
  - [Model]_Metric_Difference: Numeric differences (Portfolio - Benchmark).

Worksheet: [model]_positions (Growth and Core only; not applicable to Smid)
- [Model]_Sector_Labels: Sector labels (e.g., Financials, Healthcare).
- [Model]_Sector_Totals: Numeric percentages (e.g., 17.00%).
- [Model]Positions_SecuritiesAdded: Comma-delimited securities added this period.
- [Model]Positions_SecuritiesRemoved: Comma-delimited securities removed this period.

Parsing Recommendation:
- Sector Totals: Convert percentages into structured dictionary or list.
- Securities Lists: Split comma-delimited values into arrays.

(the alternatives and structured notes are TODOs and have different layouts)


---


Other Requirements:
- shit is generally formatted for display within excel. but just in case: we only need to show decimals IF THEY ARE REQUIRED. aka, if its not a whole number. we only need to show ONE DECIMAL PLACE FOR SUCH CASES. 
