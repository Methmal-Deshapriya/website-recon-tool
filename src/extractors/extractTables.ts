import { Page } from "playwright";

export interface Table {
  headerCount: number;
  headers: string[];
  rowCount: number;
  sampleRows: string[][];
  hasPagination: boolean;
}

export async function extractTables(page: Page): Promise<Table[]> {
  return page.evaluate(() => {
    const tables: Table[] = [];
    const tableElements = document.querySelectorAll("table");

    tableElements.forEach((tableEl) => {
      const headers: string[] = [];
      const headerElements = tableEl.querySelectorAll("thead th, thead td");

      headerElements.forEach((el) => {
        headers.push(el.textContent?.trim() || "");
      });

      const rows: string[][] = [];
      const rowElements = tableEl.querySelectorAll("tbody tr");
      const sampleSize = Math.min(5, rowElements.length);

      for (let i = 0; i < sampleSize; i++) {
        const cells = rowElements[i].querySelectorAll("td");
        const row: string[] = [];
        cells.forEach((cell) => {
          row.push(cell.textContent?.trim() || "");
        });
        rows.push(row);
      }

      const hasPagination = !!tableEl.parentElement?.querySelector("[role='navigation'], .pagination, .pager");

      const table: Table = {
        headerCount: headers.length,
        headers,
        rowCount: rowElements.length,
        sampleRows: rows,
        hasPagination,
      };

      tables.push(table);
    });

    return tables;
  });
}
