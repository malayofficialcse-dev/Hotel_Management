import * as XLSX from "xlsx";

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Exports data as a real .xlsx Excel file and triggers a browser download.
 */
export function exportToExcel({
  filename,
  sheetName = "Sheet1",
  headers,
  rows,
}: ExcelExportOptions) {
  if (typeof window === "undefined") return;

  // Build a 2D array [headers, ...rows]
  const data = [headers, ...rows.map((row) => row.map((cell) => (cell === null || cell === undefined ? "" : cell)))];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Auto-fit column widths based on maximum cell length
  const colWidths = headers.map((header, colIndex) => {
    let maxLen = header.length;
    for (const row of rows) {
      const val = row[colIndex];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}

