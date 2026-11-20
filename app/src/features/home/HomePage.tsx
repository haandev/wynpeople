import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Avatar } from '../../components/ui/Avatar'
import { SkeletonList, SkeletonStatCards } from '../../components/ui/Skeleton'
import { Badge, Card, Empty, PageHeader } from '../../components/ui/ui'
import { fmtDate, fmtHours, hoursToDays, isoDate, label } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'

const iso = isoDate
export function thisWeek(now = new Date()) {
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: iso(monday), to: iso(sunday) }
}

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const ACCENT: Record<string, string> = { VAC: 'from-sky-500 to-sky-600', SICK: 'from-rose-500 to-rose-600', PERS: 'from-violet-500 to-violet-600' }

export function HomePage() {
  const { me } = useMe()
  const week = thisWeek()
  const balances = useQuery(wyndbase.query.pto.balances({}))
  const out = useQuery(wyndbase.query.pto.whoIsOut(week))
  const inbox = useQuery(wyndbase.inbox.unread.options())
  const approvals = inbox.data?.list.interactions ?? []
  const firstName = me?.name?.split(' ')[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName ?? ''}`}
        subtitle={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={
          <Link to="/time-off" className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
            Request time off
          </Link>
        }
      />

      {balances.isLoading ? (
        <SkeletonStatCards />
      ) : (balances.data ?? []).length === 0 ? (
        <Card>
          <Empty>No time off balances yet.</Empty>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {balances.data?.map((b) => (
            <div key={b.code ?? b.type} className="relative overflow-hidden rounded-xl border border-stone-200/80 bg-white p-5 shadow-card">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ACCENT[b.code ?? ''] ?? 'from-brand-500 to-brand-600'}`} />
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{b.name ?? b.code}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">{fmtHours(b.balance)}</p>
              <p className="mt-1 text-xs text-stone-500">
                ≈ {hoursToDays(b.balance)} available · used {fmtHours(b.used)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="My approvals" className="lg:col-span-2" actions={<Badge tone={approvals.length ? 'amber' : 'stone'}>{approvals.length} waiting</Badge>}>
          {inbox.isLoading ? (
            <SkeletonList rows={3} />
          ) : approvals.length === 0 ? (
            <Empty icon="✓">Nothing waits for your decision.</Empty>
          ) : (
            <ul className="-mx-2 divide-y divide-stone-100">
              {approvals.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800">{a.title}</p>
                    {a.description && <p className="truncate text-xs text-stone-500">{a.description}</p>}
                  </div>
                  <Link to="/time-off" className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Who's out this week" actions={<span className="text-xs text-stone-400">{fmtDate(week.from)} – {fmtDate(week.to)}</span>}>
          {out.isLoading ? (
            <SkeletonList rows={3} />
          ) : (out.data ?? []).length === 0 ? (
            <Empty icon="☀">Everyone's in this week.</Empty>
          ) : (
            <ul className="space-y-3">
              {out.data?.map((o, i) => (
                <li key={`${o.employeeId}-${i}`} className="flex items-center gap-3">
                  <Avatar name={o.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800">{o.name}</p>
                    <p className="text-xs text-stone-500">
                      {label(o.category ?? 'out')} · {fmtDate(o.startDate)} – {fmtDate(o.endDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
