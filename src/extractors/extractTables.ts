import { Page } from "playwright";
import { logDebug } from "../utils/logger";

export interface Table {
  headerCount: number;
  headers: string[];
  rowCount: number;
  allRows: string[][];
  hasPagination: boolean;
  paginationPages: number;
}

export async function extractTables(page: Page): Promise<Table[]> {
  const tables: Table[] = [];
  const tableElements = await page.locator("table").all();

  logDebug(`Found ${tableElements.length} tables on page`);

  for (let tableIndex = 0; tableIndex < tableElements.length; tableIndex++) {
    try {
      const table = await extractSingleTable(page, tableIndex);
      if (table.allRows.length > 0 || table.headers.length > 0) {
        tables.push(table);
      }
    } catch (error) {
      logDebug(`Error extracting table ${tableIndex}: ${(error as Error).message}`);
    }
  }

  return tables;
}

async function extractSingleTable(page: Page, tableIndex: number): Promise<Table> {
  // Get initial table structure
  let tableData = await page.evaluate((index: number) => {
    const tableEl = document.querySelectorAll("table")[index];
    if (!tableEl) return null;

    const headers = extractHeaders(tableEl);
    const rows = extractRows(tableEl);
    const pagination = detectPagination(tableEl);

    return {
      headers,
      rows,
      pagination,
    };

    function extractHeaders(table: Element): string[] {
      const headers: string[] = [];

      // Try thead first
      const theadCells = table.querySelectorAll("thead th, thead td");
      if (theadCells.length > 0) {
        theadCells.forEach((cell) => {
          headers.push(cell.textContent?.trim() || "");
        });
        return headers;
      }

      // Fallback: try first row as headers
      const firstRow = table.querySelector("tbody tr, tr");
      if (firstRow) {
        const cells = firstRow.querySelectorAll("th, td");
        cells.forEach((cell) => {
          headers.push(cell.textContent?.trim() || "");
        });
      }

      return headers;
    }

    function extractRows(table: Element): string[][] {
      const rows: string[][] = [];

      // Try tbody first
      let rowElements: Element[] = Array.from(table.querySelectorAll("tbody tr"));

      // If no tbody, use all tr except first (if it's headers)
      if (rowElements.length === 0) {
        rowElements = Array.from(table.querySelectorAll("tr"));
        // Skip first row if it looks like headers
        if (rowElements.length > 0) {
          const firstRowCells = rowElements[0].querySelectorAll("th");
          if (firstRowCells.length > 0) {
            rowElements = rowElements.slice(1);
          }
        }
      }

      rowElements.forEach((row) => {
        const cells = row.querySelectorAll("td, th");
        const rowData: string[] = [];
        cells.forEach((cell) => {
          rowData.push(cell.textContent?.trim() || "");
        });
        if (rowData.length > 0) {
          rows.push(rowData);
        }
      });

      return rows;
    }

    function detectPagination(table: Element) {
      const parent = table.parentElement;
      if (!parent) return null;

      // Check for common pagination elements
      const paginationSelectors = [
        "[role='navigation']",
        ".pagination",
        ".pager",
        ".paginator",
        "[data-testid*='pagination']",
        "nav[aria-label*='paginat']",
        ".page-navigation",
      ];

      for (const selector of paginationSelectors) {
        if (parent.querySelector(selector)) {
          return {
            exists: true,
            selector: selector,
          };
        }
      }

      return { exists: false };
    }
  }, tableIndex);

  if (!tableData) {
    return {
      headerCount: 0,
      headers: [],
      rowCount: 0,
      allRows: [],
      hasPagination: false,
      paginationPages: 0,
    };
  }

  let allRows = tableData.rows;
  let pageCount = 1;
  let hasPagination = false;

  // Handle pagination if detected
  if (tableData.pagination && tableData.pagination.exists) {
    hasPagination = true;
    logDebug(`Table ${tableIndex} has pagination, extracting all pages...`);

    const paginationResult = await extractPaginatedTable(page, tableIndex);
    allRows = paginationResult.allRows;
    pageCount = paginationResult.pageCount;
  }

  return {
    headerCount: tableData.headers.length,
    headers: tableData.headers,
    rowCount: allRows.length,
    allRows,
    hasPagination,
    paginationPages: pageCount,
  };
}

async function extractPaginatedTable(
  page: Page,
  tableIndex: number
): Promise<{ allRows: string[][]; pageCount: number }> {
  const allRows: string[][] = [];
  let pageCount = 0;
  const maxPages = 100; // Safety limit

  while (pageCount < maxPages) {
    pageCount++;

    // Extract current page rows
    const currentPageRows = await page.evaluate((index: number) => {
      const tableEl = document.querySelectorAll("table")[index];
      if (!tableEl) return [];

      const rows: string[][] = [];
      let rowElements: Element[] = Array.from(tableEl.querySelectorAll("tbody tr"));

      if (rowElements.length === 0) {
        rowElements = Array.from(tableEl.querySelectorAll("tr"));
        if (rowElements.length > 0) {
          const firstRowCells = rowElements[0].querySelectorAll("th");
          if (firstRowCells.length > 0) {
            rowElements = rowElements.slice(1);
          }
        }
      }

      rowElements.forEach((row) => {
        const cells = row.querySelectorAll("td, th");
        const rowData: string[] = [];
        cells.forEach((cell) => {
          rowData.push(cell.textContent?.trim() || "");
        });
        if (rowData.length > 0) {
          rows.push(rowData);
        }
      });

      return rows;
    }, tableIndex);

    // Add rows from current page
    allRows.push(...currentPageRows);

    // Try to find and click next button
    const nextButtonClicked = await clickNextPage(page);
    if (!nextButtonClicked) {
      break;
    }

    // Wait for page to load
    await page.waitForTimeout(500);

    // Check if we're on a new page by counting rows
    const newRowCount = await page.evaluate((index: number) => {
      const tableEl = document.querySelectorAll("table")[index];
      if (!tableEl) return 0;

      let rowElements = tableEl.querySelectorAll("tbody tr");
      if (rowElements.length === 0) {
        rowElements = tableEl.querySelectorAll("tr");
      }
      return rowElements.length;
    }, tableIndex);

    // If row count is same, we might be stuck (no more pages)
    if (newRowCount === currentPageRows.length && pageCount > 1) {
      break;
    }
  }

  return { allRows, pageCount };
}

async function clickNextPage(page: Page): Promise<boolean> {
  const nextSelectors = [
    'a[aria-label*="next"], button[aria-label*="next"]',
    ".pagination a:last-child",
    ".pager a:last-child",
    'a:has(svg[data-icon="chevron-right"])',
    "button:has-text('Next')",
    "a:has-text('Next')",
    "button:has-text('>')",
    "a[rel='next']",
    "[data-testid*='pagination-next']",
  ];

  for (const selector of nextSelectors) {
    try {
      const element = await page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      const isDisabled = await element
        .evaluate((el: Element) => (el as HTMLElement).hasAttribute("disabled"))
        .catch(() => true);

      if (isVisible && !isDisabled) {
        await element.click();
        return true;
      }
    } catch {
      // Try next selector
    }
  }

  return false;
}

export function convertTableToCSV(table: Table): string {
  const rows: string[][] = [];

  // Add header row
  if (table.headers.length > 0) {
    rows.push(table.headers);
  }

  // Add data rows
  rows.push(...table.allRows);

  // Convert to CSV format
  return rows
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (cell.includes(",") || cell.includes("\n") || cell.includes('"')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    )
    .join("\n");
}
