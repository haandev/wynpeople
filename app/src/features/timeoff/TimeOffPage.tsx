import { useState } from 'react'
import { Button, Card } from '../../components/ui/ui'
import { fmtHours } from '../../lib/format'
import { ApprovalCard } from './ApprovalCard'
import { Calendar } from './Calendar'
import { useApprovals, useMyBalances } from './data'
import { RequestDialog } from './RequestDialog'
import { MyRequests } from './TeamRequests'

export function TimeOffPage() {
  const [open, setOpen] = useState(false)
  const balances = useMyBalances()
  const approvals = useApprovals()
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Time Off</h1>
        <Button onClick={() => setOpen(true)}>Request Time Off</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {(balances.data ?? []).map((b) => (
          <Card key={b.code ?? b.type}>
            <p className="text-xs uppercase tracking-wide text-stone-500">{b.name ?? b.code}</p>
            <p className="mt-1 text-2xl font-semibold text-brand-800">{fmtHours(b.balance)}</p>
            <p className="text-xs text-stone-500">
              accrued {fmtHours(b.accrued)} · used {fmtHours(b.used)}
            </p>
          </Card>
        ))}
      </div>
      {(approvals.data ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-brand-800">Waiting for your decision</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {approvals.data?.map((a) => (
              <ApprovalCard key={a.interactionId} a={a} />
            ))}
          </div>
        </section>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Calendar />
        </div>
        <MyRequests />
      </div>
      {open && <RequestDialog onClose={() => setOpen(false)} />}
    </div>
  )
}
