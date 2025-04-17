# Modern Stack Reference Guide - Hohimer Wealth Management Quarterly Report Generator

This document serves as a reference for the current state of libraries and modern practices that should be followed when working on the Hohimer Wealth Management Quarterly Report Generator project.

## Library Versions and Dependencies

### Current Library Versions (as of April 2025)

| Library | Current Version | Description |
|---------|----------------|-------------|
| Puppeteer | 24.6.1 | Browser automation library for PDF generation |
| ExcelJS | 4.3.0 | Library for Excel file parsing |
| Handlebars | 4.7.8 | Templating engine for report layouts |
| express-handlebars | 8.0.1 | Express integration for Handlebars (if using Express) |

## Puppeteer Modern Practices

### Key Changes and Best Practices

1. **Launch Configuration**
   - Use headless mode by default with the new implementation:
   ```javascript
   const browser = await puppeteer.launch({ headless: "new" });
   ```

2. **Waiting for Elements**
   - Avoid deprecated `waitFor()` method
   - Use specific waiting methods with AbortSignal support:
   ```javascript
   const controller = new AbortController();
   await page.waitForSelector(selector, { signal: controller.signal });
   ```

3. **PDF Generation**
   - Use expanded PDF options for better control:
   ```javascript
   await page.pdf({
     path: './output/report.pdf',
     format: 'Letter',
     printBackground: true,
     displayHeaderFooter: true,
     headerTemplate: headerHtml,
     footerTemplate: footerHtml,
     margin: {
       top: '0.6in',
       right: '0.6in',
       bottom: '0.6in',
       left: '0.6in'
     },
     preferCSSPageSize: true
   });
   ```

4. **Screenshots**
   - Use `captureBeyondViewport` for full-page screenshots:
   ```javascript
   await page.screenshot({ 
     path: 'screenshot.png',
     fullPage: true,
     captureBeyondViewport: true
   });
   ```

5. **Selector Usage**
   - Use modern selector approaches:
   ```javascript
   // Instead of deprecated $x for XPath
   const elements = await page.$$('xpath selector');
   
   // Use page.$ and page.$$ for CSS selectors
   const element = await page.$('.selector');
   const elements = await page.$$('.selector');
   ```

6. **Timeouts and Cancellation**
   - Use AbortController for cancelable operations:
   ```javascript
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 30000);
   
   try {
     await page.waitForSelector('#element', { signal: controller.signal });
   } catch (error) {
     if (error.name === 'AbortError') {
       console.log('Operation was aborted');
     }
   } finally {
     clearTimeout(timeout);
   }
   ```

### Deprecated Puppeteer Features to Avoid

- ❌ `page.waitFor()` - Use `waitForSelector()`, `waitForFunction()`, etc.
- ❌ `page.$x()` - Use `page.$$('xpath/selector')` instead
- ❌ `page.waitForXPath()` - Use `page.waitForSelector()` with an XPath selector
- ❌ `defaultViewport: null` without specifying dimensions

## Handlebars Modern Practices

### Best Practices

1. **Block Parameters**
   - Use block parameters for clearer iteration:
   ```handlebars
   {{#each modelData.top10 as |holding index|}}
     <div class="holding-row">
       <div class="holding-name">{{holding.name}}</div>
       <div class="holding-value">{{holding.weight}}%</div>
     </div>
   {{/each}}
   ```

2. **Partial Blocks**
   - Use partial blocks for more flexible templates:
   ```handlebars
   {{#> modelTemplate}}
     <div class="model-specific-content">
       <!-- Model-specific content -->
     </div>
   {{/modelTemplate}}
   ```

3. **Helper Functions**
   - Register helpers for formatting numbers:
   ```javascript
   Handlebars.registerHelper('formatDecimal', function(value) {
     // Only show decimals if needed (per project requirements)
     return Number.isInteger(value) ? value : value.toFixed(1);
   });
   ```

## Excel Parsing Best Practices

1. **Named Ranges**
   - Continue using named ranges approach for consistent access to Excel data
   - Follow the established naming pattern: `[Model]_[DataType]`

2. **Async/Await Pattern**
   - Use async/await for all file operations:
   ```javascript
   async function parseExcelFile(filePath) {
     const workbook = new ExcelJS.Workbook();
     await workbook.xlsx.readFile(filePath);
     // Process workbook
   }
   ```

3. **Error Handling**
   - Implement robust error handling for Excel operations:
   ```javascript
   try {
     const workbook = await openWorkbook(filePath);
     // Process workbook
   } catch (error) {
     console.error(`Error processing Excel file: ${error.message}`);
     // Handle error appropriately
   }
   ```

## Rendering and PDF Generation Flow

For optimal performance and consistency, follow this rendering flow:

1. Parse Excel data using ExcelJS
2. Transform data into template-friendly structures
3. Render HTML using Handlebars templates
4. Use Puppeteer to convert HTML to PDF:
   ```javascript
   const browser = await puppeteer.launch();
   const page = await browser.newPage();
   
   // Set content directly instead of navigating to a URL
   await page.setContent(renderedHtml, {
     waitUntil: 'networkidle0'
   });
   
   // Apply any necessary styles or scripts
   await page.addStyleTag({ path: './src/styles/print.css' });
   
   // Generate PDF
   await page.pdf({
     path: './output/quarterly_report.pdf',
     format: 'Letter',
     printBackground: true,
     margin: {
       top: '0.5in',
       right: '0.5in',
       bottom: '0.5in',
       left: '0.5in'
     }
   });
   
   await browser.close();
   ```

## Performance Considerations

1. **Template Caching**
   - Cache compiled Handlebars templates in production
   
2. **Browser Instance Management**
   - Reuse browser instances where possible rather than creating new ones for each report
   
3. **Parallel Processing**
   - Consider generating multiple reports in parallel if processing many models:
   ```javascript
   const reports = await Promise.all(
     models.map(model => generateModelReport(model))
   );
   ```

## Formatting Requirements

Remember these key formatting requirements specific to this project:

1. **Decimal Handling**
   - Only show decimal places if they are required (not whole numbers)
   - When decimals are needed, show exactly ONE decimal place

2. **Layout Consistency**
   - Maintain consistent header and footer across pages
   - Follow the established model-specific layouts for each investment model

---

This guide reflects the current state of best practices as of April 2025. As libraries evolve, this document should be updated to reflect current best practices.
