import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export const PALETTE = ['#8257da', '#16a34a', '#ea580c', '#e11d48', '#0891b2', '#ca8a04', '#4f46e5', '#db2777', '#65a30d', '#0d9488']

export interface Slice {
  label: string
  n: number
}

/** A donut with the total in the middle and a legend beside it (below it when the widget is narrow). */
export function Donut({ data, center }: { data: Slice[]; center: string }) {
  const total = data.reduce((s, d) => s + d.n, 0)
  return (
    <div className="flex h-full items-center justify-center gap-5">
      <div className="relative aspect-square h-full max-h-40 min-h-24 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="n" nameKey="label" innerRadius="68%" outerRadius="100%" paddingAngle={data.length > 1 ? 1.5 : 0} stroke="none" isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={d.label} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${v} people`, '']} separator="" />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-2xl font-semibold text-stone-900">{total}</span>
          <span className="text-xs text-stone-500">{center}</span>
        </div>
      </div>
      <ul className="min-w-0 max-w-[55%] space-y-1.5 overflow-auto text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="truncate text-stone-700">{d.label}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums text-stone-900">{d.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** One series over months: `data` is [{ month: 'Nov', value }]. */
export function MonthLine({ data, unit }: { data: { month: string; value: number }[]; unit: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="#f0eeec" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v) => [`${v} ${unit}`, '']} separator="" />
        <Line type="monotone" dataKey="value" stroke={PALETTE[0]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
