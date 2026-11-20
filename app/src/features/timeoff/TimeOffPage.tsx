import { useState } from 'react'
import { SkeletonStatCards } from '../../components/ui/Skeleton'
import { Button, PageHeader, Segmented } from '../../components/ui/ui'
import { fmtHours } from '../../lib/format'
import { AvailabilityMatrix } from '../availability/AvailabilityMatrix'
import { ApprovalCard } from './ApprovalCard'
import { Calendar } from './Calendar'
import { useApprovals, useMyBalances } from './data'
import { RequestDialog } from './RequestDialog'
import { OutOfOffice } from './OutOfOffice'
import { MyRequests } from './TeamRequests'
import { useMe } from '../../lib/useMe'

export function TimeOffPage() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'calendar' | 'matrix'>('calendar')
  const balances = useMyBalances()
  const approvals = useApprovals()
  const { me } = useMe()
  // Whoever answers approvals can lend them: managers, and HR (who decide requests that have no manager).
  const canDecide = !!me && (me.isManager || me.roles.includes('hr_manager') || me.roles.includes('hr_admin'))
  return (
    <div className="space-y-5">
      <PageHeader title="Time off" subtitle="Your balances, requests and the team's calendar." actions={<Button onClick={() => setOpen(true)}>Request time off</Button>} />
      {balances.isLoading ? (
        <SkeletonStatCards />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {(balances.data ?? []).map((b) => (
            <div key={b.code ?? b.type} className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-card">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{b.name ?? b.code}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">{fmtHours(b.balance)}</p>
              <p className="mt-1 text-xs text-stone-500">
                accrued {fmtHours(b.accrued)} · used {fmtHours(b.used)}
              </p>
            </div>
          ))}
        </div>
      )}
      {(approvals.data ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-900">Waiting for your decision</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {approvals.data?.map((a) => (
              <ApprovalCard key={a.interactionId} a={a} />
            ))}
          </div>
        </section>
      )}
      {canDecide && <OutOfOffice />}
      <Segmented
        options={[
          { value: 'calendar', label: "Who's out" },
          { value: 'matrix', label: 'Team availability' },
        ]}
        value={view}
        onChange={setView}
      />
      {view === 'matrix' ? (
        <AvailabilityMatrix />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Calendar />
          </div>
          <MyRequests />
        </div>
      )}
      {open && <RequestDialog onClose={() => setOpen(false)} />}
    </div>
  )
}
