import { cellText, type Column, type Meta, type Row } from './meta'

/** Spreadsheet apps run cells that start with these as formulas. */
const guard = (s: string) => (/^[=+\-@]/.test(s) ? `'${s}` : s)
const quote = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
const cell = (v: unknown) => quote(guard(cellText(v)))

/** RFC 4180 CSV: meta lines, a blank line, the header, the rows. */
export function toCsv(meta: Meta, columns: Column[], rows: Row[]): string {
  const lines = [
    ...meta.map(([k, v]) => `${cell(k)},${cell(v)}`),
    '',
    columns.map((c) => cell(c.title)).join(','),
    ...rows.map((r) => columns.map((c) => cell(r[c.key])).join(',')),
  ]
  return lines.join('\r\n')
}
