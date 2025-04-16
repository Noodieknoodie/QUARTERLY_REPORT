# Lessons Learned - Hohimer Report Generator

## Excel Parsing
- ExcelJS has issues with certain Excel features (especially filter buttons) that cause cryptic errors
- SheetJS is more resilient for real-world Excel files with complex features
- When encountering "Cannot set properties of undefined (setting 'filterButton')" error, switch libraries
- Named ranges work better with SheetJS than with raw cell references for maintainability

## Module Systems
- ES Modules and CommonJS don't mix easily
- When using libraries that export CommonJS (like xlsx), use dynamic import or the "pkg" pattern:
  ```js
  import pkg from 'xlsx';
  const { readFile, utils } = pkg;
  ```

## Testing
- Jest requires special configuration for ES Modules
- Don't duplicate Jest configuration between jest.config.js and package.json
- Add diagnostic tests that catch but don't throw errors to discover root causes
- Test critical file operations separately before integrating

## Error Handling
- Add verbose error handling around file operations
- For Excel processing, handle missing sheets, ranges, and workbook features defensively
- Log specifics (which exact named range failed) rather than generic errors

## Real-World Excel Files
- Don't assume pristine data structure; handle merged cells, formulas, and special features
- Process one worksheet at a time when debugging complex workbooks
- Handle non-existent named ranges gracefully
- Account for extra whitespace in named ranges and text values
