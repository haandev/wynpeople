import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { Button, Card, Empty, ErrorNote, Field, inputCls } from '../../components/ui/ui'
import { toCsv } from '../../lib/export/csv'
import { cellText, exportMeta, type Row } from '../../lib/export/meta'
import { toPdf } from '../../lib/export/pdf'
import { toXlsx } from '../../lib/export/xlsx'
import { errorMessage, todayIso } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { useOrgTree } from '../profile/data'
import { availability, flattenBalances, leaveSummary, type ReportDef } from './reports'

const startOfYear = () => `${new Date().getFullYear()}-01-01`
const endOfYear = () => `${new Date().getFullYear()}-12-31`

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ReportView({ def }: { def: ReportDef }) {
  const { me } = useMe()
  const tree = useOrgTree()
  const [f, setF] = useState({ departmentTeamId: '', officeTeamId: '', status: '', from: startOfYear(), to: endOfYear(), groupBy: 'department' as 'department' | 'productTeam' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const has = (k: ReportDef['filters'][number]) => def.filters.includes(k)
  const common = { departmentTeamId: f.departmentTeamId || null, officeTeamId: f.officeTeamId || null }
  const k = def.key

  const directory = useQuery({ ...wyndbase.query.rpt.employeeDirectory({ ...common, status: f.status || null }), enabled: k === 'employeeDirectory' })
  const balances = useQuery({ ...wyndbase.query.rpt.ptoBalances({ ...common, status: f.status || null }), enabled: k === 'ptoBalances' })
  const usage = useQuery({
    ...wyndbase.query.rpt.ptoUsageHistory({ ...common, status: k === 'ptoUsageHistory' ? f.status || null : null, from: f.from, to: f.to }),
    enabled: k === 'ptoUsageHistory' || k === 'leaveSummary' || k === 'availability',
  })
  const funnel = useQuery({ ...wyndbase.query.rpt.ptoFunnel({ ...common, from: f.from, to: f.to }), enabled: k === 'ptoFunnel' })
  const runs = useQuery({ ...wyndbase.query.rpt.accrualRuns({ from: f.from, to: f.to }), enabled: k === 'accrualRuns' })
  const exportsQ = useQuery({ ...wyndbase.query.rpt.exportEvents(), enabled: k === 'exportEvents' })
  const audit = useQuery({ ...wyndbase.query.rpt.auditLog({ from: f.from, to: f.to }), enabled: k === 'auditLog', retry: false })

  const active = { employeeDirectory: directory, ptoBalances: balances, ptoUsageHistory: usage, leaveSummary: usage, availability: usage, ptoFunnel: funnel, accrualRuns: runs, exportEvents: exportsQ, auditLog: audit }[k]
  const rows: Row[] = useMemo(() => {
    if (k === 'ptoBalances') return flattenBalances(balances.data ?? [])
    if (k === 'leaveSummary') return leaveSummary(usage.data ?? [], f.groupBy)
    if (k === 'availability') return availability(usage.data ?? [], f.from, f.to)
    return ((active.data as Row[] | undefined) ?? []) as Row[]
  }, [k, active.data, balances.data, usage.data, f.groupBy, f.from, f.to])

  const filtersForMeta = () => {
    const out: Record<string, unknown> = {}
    if (has('department')) out.departmentTeamId = f.departmentTeamId || null
    if (has('office')) out.officeTeamId = f.officeTeamId || null
    if (has('status')) out.status = f.status || null
    if (has('range')) Object.assign(out, { from: f.from, to: f.to })
    if (has('groupBy')) out.groupBy = f.groupBy
    return out
  }

  const exportAs = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setBusy(true)
    setError(null)
    try {
      const filters = filtersForMeta()
      const meta = exportMeta({ generatedBy: me?.name ?? 'unknown', generatedAt: new Date(), filters })
      const base = `${def.key}-${todayIso()}`
      const blob =
        format === 'csv'
          ? new Blob([`﻿${toCsv(meta, def.columns, rows)}`], { type: 'text/csv;charset=utf-8' })
          : format === 'xlsx'
            ? toXlsx(meta, def.columns, rows)
            : toPdf(def.title, meta, def.columns, rows)
      // Logged before the file is handed over, so an export that is not recorded is not delivered.
      await wyndbase.mutation.rpt.logExport({ report: def.key, format, filters, rowCount: rows.length })
      download(blob, `${base}.${format}`)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const units = (kind: string) => (tree.data ?? []).filter((u) => u.kind === kind)
  return (
    <Card
      title={def.title}
      actions={
        <>
          {(['csv', 'xlsx', 'pdf'] as const).map((fmt) => (
            <Button key={fmt} variant="secondary" disabled={busy || rows.length === 0} onClick={() => exportAs(fmt)}>
              {fmt.toUpperCase()}
            </Button>
          ))}
        </>
      }
    >
      <p className="mb-3 text-sm text-stone-500">{def.description}</p>
      {def.filters.length > 0 && (
        <div className="mb-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {has('department') && (
            <Field label="Department">
              <select className={inputCls} value={f.departmentTeamId} onChange={(e) => setF({ ...f, departmentTeamId: e.target.value })}>
                <option value="">All</option>
                {units('department').map((u) => (
                  <option key={u.unitId} value={u.teamId ?? ''}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {has('office') && (
            <Field label="Location">
              <select className={inputCls} value={f.officeTeamId} onChange={(e) => setF({ ...f, officeTeamId: e.target.value })}>
                <option value="">All</option>
                {units('office').map((u) => (
                  <option key={u.unitId} value={u.teamId ?? ''}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {has('status') && (
            <Field label="Status">
              <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                <option value="">All</option>
                {(k === 'ptoUsageHistory' ? ['pending', 'approved', 'denied', 'canceled'] : ['active', 'leave', 'terminated']).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {has('range') && (
            <>
              <Field label="From">
                <input type="date" className={inputCls} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
              </Field>
              <Field label="To">
                <input type="date" className={inputCls} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
              </Field>
            </>
          )}
          {has('groupBy') && (
            <Field label="Group by">
              <select className={inputCls} value={f.groupBy} onChange={(e) => setF({ ...f, groupBy: e.target.value as 'department' | 'productTeam' })}>
                <option value="department">Department</option>
                <option value="productTeam">Product team</option>
              </select>
            </Field>
          )}
        </div>
      )}
      <ErrorNote error={error ?? (active.error ? errorMessage(active.error) : null)} />
      {active.isLoading ? (
        <SkeletonTable rows={7} cols={Math.min(def.columns.length, 7)} />
      ) : rows.length === 0 ? (
        <Empty>No rows for these filters.</Empty>
      ) : (
        <div className="max-h-[60vh] overflow-auto">
          <table className="tbl">
            <thead>
              <tr>
                {def.columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap">
                    {c.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {def.columns.map((c) => (
                    <td key={c.key} className="max-w-xs truncate py-1.5 pr-4" title={cellText(r[c.key])}>
                      {cellText(r[c.key]) || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-stone-400">{rows.length} rows</p>
        </div>
      )}
    </Card>
  )
}
