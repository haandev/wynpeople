import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { cellText, type Column, type Meta, type Row } from './meta'

/** Landscape PDF: title and metadata block, then the table. */
export function toPdf(title: string, meta: Meta, columns: Column[], rows: Row[]): Blob {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text(title, 14, 16)
  doc.setFontSize(8)
  meta.forEach(([k, v], i) => doc.text(`${k}: ${v}`, 14, 23 + i * 4))
  autoTable(doc, {
    startY: 26 + meta.length * 4,
    head: [columns.map((c) => c.title)],
    body: rows.map((r) => columns.map((c) => cellText(r[c.key]))),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [59, 111, 37] },
  })
  return doc.output('blob')
}
