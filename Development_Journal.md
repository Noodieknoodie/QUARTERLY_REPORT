# Hohimer Report Generator - Project Roadmap

## Phase 1: Excel Data Extraction
- [x] Parse Excel workbook with investment model data
- [x] Extract model metadata (As Of Date, Portfolio, etc.)
- [x] Extract model commentary text
- [x] Extract Top 10 holdings with weights
- [x] Extract Regional Allocations
- [x] Extract Metrics (Portfolio vs Benchmark)
- [x] Extract Sector breakdowns
- [x] Extract Securities Added/Removed
- [x] Format numbers (show decimals only when needed)
- [x] Create reliable error handling

## Phase 2: Report Template Creation
- [ ] Create base Handlebars template structure
- [ ] Implement header and footer partials
- [ ] Design cover page template
- [ ] Design index page template
- [ ] Create model-specific page templates (Core, Growth, etc.)
- [ ] Add CSS styling for print formatting

## Phase 3: PDF Generation
- [ ] Set up Puppeteer for HTML to PDF conversion
- [ ] Configure proper page sizing and margins
- [ ] Implement header/footer on all pages
- [ ] Generate complete multi-page PDF report
- [ ] Save output to designated directory

## Phase 4: Integration & Usability
- [ ] Create simple command-line interface
- [ ] Add configuration options (input/output paths)
- [ ] Add basic error handling and logging
- [ ] Create simple documentation
- [ ] Test with various Excel files
