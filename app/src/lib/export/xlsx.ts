import * as XLSX from 'xlsx'
import { cellText, type Column, type Meta, type Row } from './meta'

/** Workbook with a "Report" sheet and a "Metadata" sheet. */
export function toXlsx(meta: Meta, columns: Column[], rows: Row[]): Blob {
  const wb = XLSX.utils.book_new()
  const data = [columns.map((c) => c.title), ...rows.map((r) => columns.map((c) => (typeof r[c.key] === 'number' ? r[c.key] : cellText(r[c.key]))))]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Report')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['key', 'value'], ...meta]), 'Metadata')
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
