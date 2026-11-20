import { useState } from 'react'
import { Button } from '../../components/ui/ui'
import { errorMessage, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'

/** GDPR subject access export: everything stored about one person, as JSON. Logged before the download. */
export function SubjectAccessButton({ employeeId, employeeNumber }: { employeeId: string; employeeNumber: string | null }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      const rows = await wyndbase.query.gdpr.subjectAccessExport({ employeeId })
      await wyndbase.mutation.rpt.logExport({ report: 'subjectAccessExport', format: 'json', filters: { employeeId }, rowCount: rows.length })
      const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), data: rows[0] ?? null }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `subject-access-${employeeNumber ?? employeeId}-${todayIso()}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <Button variant="secondary" disabled={busy} onClick={run}>
        {busy ? 'Preparing…' : 'Export personal data'}
      </Button>
    </div>
  )
}
