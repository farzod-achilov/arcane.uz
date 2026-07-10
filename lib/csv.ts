/** Escapes a CSV field: quotes commas/quotes/newlines, and neutralizes
 *  spreadsheet formula injection — a value starting with =, +, -, or @
 *  would otherwise execute as a formula when opened in Excel/Sheets. */
export function escapeCsvField(v: unknown): string {
  if (v == null) return '';
  let s = String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildCsv(header: string[], rows: unknown[][]): string {
  const lines = [header, ...rows].map(row => row.map(escapeCsvField).join(','));
  return '﻿' + lines.join('\r\n'); // BOM — Excel needs it to detect UTF-8
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
