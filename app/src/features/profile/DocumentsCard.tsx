import { useRef, useState } from 'react'
import { Button, Card, Empty, ErrorNote } from '../../components/ui/ui'
import { errorMessage, fmtDate } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { type ProfileRow, refreshAll } from './data'

const COLUMN = 'hr.employees.documents'
// attach wants the column's _id: the 'space.table.column' spelling of the SDK docs is refused (see findings).
const COLUMN_ID = '01a1f80f-bc1a-76bc-a5b6-dd48fa916eac'
const kb = (n: number | null | undefined) => (n ? (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`) : '')

/** Employee documents (contracts, IDs): a Wyndbase file column. HR of the office uploads and removes; the person reads. */
export function DocumentsCard({ p, canEdit }: { p: ProfileRow; canEdit: boolean }) {
  const docs = (p.documents ?? []) as { _id: string; filename: string | null; size: number | null; contentType: string | null; _createdAt: string }[]
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      // attach uploads the bytes and answers the attachment id; writing it into the cell is ours.
      const res = await wyndbase.storage.attach(file, { column: COLUMN_ID, record: p.employeeId })
      await wyndbase.mutation.hr.setDocuments({ employeeId: p.employeeId, attachmentIds: [...docs.map((d) => d._id), res.attachmentId] })
      await refreshAll()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  const remove = async (id: string) => {
    if (!confirm('Remove this document from the profile?')) return
    setError(null)
    try {
      await wyndbase.mutation.hr.setDocuments({ employeeId: p.employeeId, attachmentIds: docs.filter((d) => d._id !== id).map((d) => d._id) })
      await refreshAll()
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  const open = async (id: string) => {
    setError(null)
    try {
      const { url } = await wyndbase.storage.getUrl({ column: COLUMN, record: p.employeeId, attachmentId: id })
      window.open(url, '_blank', 'noopener')
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <Card
      title="Documents"
      className="lg:col-span-2"
      actions={
        canEdit && (
          <>
            <input ref={input} type="file" className="hidden" accept="application/pdf,image/*,.doc,.docx" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? 'Uploading…' : 'Upload'}
            </Button>
          </>
        )
      }
    >
      <ErrorNote error={error} />
      {docs.length === 0 ? (
        <Empty icon="▤">{canEdit ? 'No documents yet. Upload a contract or an ID (PDF, image or Word, up to 10 MB).' : 'No documents on file, or not visible to you.'}</Empty>
      ) : (
        <ul className="divide-y divide-stone-100">
          {docs.map((d) => (
            <li key={d._id} className="flex items-center justify-between gap-3 py-2.5">
              <button type="button" onClick={() => open(d._id)} className="flex min-w-0 items-center gap-3 text-left">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                  {(d.filename?.split('.').pop() ?? 'FILE').slice(0, 4).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-stone-800 hover:text-brand-700">{d.filename}</span>
                  <span className="block text-xs text-stone-500">
                    {kb(d.size)} · {fmtDate(d._createdAt)}
                  </span>
                </span>
              </button>
              {canEdit && (
                <Button variant="ghost" onClick={() => remove(d._id)}>
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
