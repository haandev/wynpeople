import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Badge, Card, Empty } from '../../components/ui/ui'
import { fmtDate, fmtHours, label } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'

const iso = (d: Date) => d.toISOString().slice(0, 10)
export function thisWeek(now = new Date()) {
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: iso(monday), to: iso(sunday) }
}

export function HomePage() {
  const { me } = useMe()
  const week = thisWeek()
  const balances = useQuery(wyndbase.query.pto.balances({}))
  const out = useQuery(wyndbase.query.pto.whoIsOut(week))
  const inbox = useQuery(wyndbase.inbox.unread.options())
  const approvals = inbox.data?.list.interactions ?? []

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-stone-500">Welcome back</p>
            <h1 className="text-2xl font-semibold">{me?.name}</h1>
          </div>
          <Link to="/time-off" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Request Time Off
          </Link>
        </div>
        <Card title="My time off">
          {(balances.data ?? []).length === 0 ? (
            <Empty>{balances.isLoading ? 'Loading…' : 'No balances yet.'}</Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {balances.data?.map((b) => (
                <div key={b.code ?? b.type} className="rounded-md bg-brand-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-brand-700">{b.name ?? b.code}</p>
                  <p className="mt-1 text-2xl font-semibold text-brand-800">{fmtHours(b.balance)}</p>
                  <p className="text-xs text-stone-500">available</p>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="My approvals" actions={<Badge tone={approvals.length ? 'amber' : 'stone'}>{approvals.length}</Badge>}>
          {approvals.length === 0 ? (
            <Empty>Nothing waits for your decision.</Empty>
          ) : (
            <ul className="divide-y divide-stone-100">
              {approvals.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    {a.description && <p className="text-xs text-stone-500">{a.description}</p>}
                  </div>
                  <Link to="/time-off" className="text-sm font-medium text-brand-700 hover:underline">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card title={`Who's out · ${fmtDate(week.from)} – ${fmtDate(week.to)}`}>
        {(out.data ?? []).length === 0 ? (
          <Empty>Everyone's in this week.</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {out.data?.map((o, i) => (
              <li key={`${o.employeeId}-${i}`}>
                <p className="font-medium">{o.name}</p>
                <p className="text-xs text-stone-500">
                  {label(o.category ?? 'out')} · {fmtDate(o.startDate)} – {fmtDate(o.endDate)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
