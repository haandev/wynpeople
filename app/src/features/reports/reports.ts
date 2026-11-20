import type { Column, Row } from '../../lib/export/meta'

export type ReportKey =
  | 'employeeDirectory'
  | 'ptoBalances'
  | 'ptoUsageHistory'
  | 'leaveSummary'
  | 'availability'
  | 'ptoFunnel'
  | 'accrualRuns'
  | 'exportEvents'
  | 'auditLog'

export interface ReportDef {
  key: ReportKey
  title: string
  description: string
  filters: ('department' | 'office' | 'status' | 'range' | 'groupBy')[]
  columns: Column[]
  hrOnly?: boolean
  adminOnly?: boolean
}

export const REPORTS: ReportDef[] = [
  {
    key: 'employeeDirectory', title: 'Employee directory', description: 'Everyone with job, location and manager.', filters: ['department', 'office', 'status'],
    columns: [
      { key: 'employeeNumber', title: 'Employee #' }, { key: 'name', title: 'Name' }, { key: 'jobTitle', title: 'Job title' }, { key: 'department', title: 'Department' },
      { key: 'productTeam', title: 'Product team' }, { key: 'office', title: 'Location' }, { key: 'manager', title: 'Manager' }, { key: 'status', title: 'Status' },
      { key: 'employmentType', title: 'Employment type' }, { key: 'hireDate', title: 'Hire date' }, { key: 'workEmail', title: 'Work email' },
    ],
  },
  {
    key: 'ptoBalances', title: 'Time off balances', description: 'Accrued, used, pending and remaining hours per type.', filters: ['department', 'office', 'status'],
    columns: [
      { key: 'employeeNumber', title: 'Employee #' }, { key: 'employee', title: 'Employee' }, { key: 'office', title: 'Location' }, { key: 'type', title: 'Type' },
      { key: 'accrued', title: 'Accrued (h)' }, { key: 'used', title: 'Used (h)' }, { key: 'expired', title: 'Expired (h)' }, { key: 'pending', title: 'Pending (h)' }, { key: 'remaining', title: 'Remaining (h)' },
    ],
  },
  {
    key: 'ptoUsageHistory', title: 'Time off usage history', description: 'Every request in the period.', filters: ['department', 'office', 'status', 'range'],
    columns: [
      { key: 'employee', title: 'Employee' }, { key: 'department', title: 'Department' }, { key: 'office', title: 'Location' }, { key: 'type', title: 'Type' },
      { key: 'startDate', title: 'Start' }, { key: 'endDate', title: 'End' }, { key: 'totalHours', title: 'Hours' }, { key: 'status', title: 'Status' }, { key: 'decidedBy', title: 'Decided by' },
    ],
  },
  {
    key: 'leaveSummary', title: 'Leave summary', description: 'Approved hours per group and type.', filters: ['office', 'range', 'groupBy'],
    columns: [{ key: 'group', title: 'Group' }, { key: 'type', title: 'Type' }, { key: 'totalHours', title: 'Hours' }, { key: 'people', title: 'People' }],
  },
  {
    key: 'availability', title: 'Availability', description: 'Who is out on each day (approved and pending).', filters: ['department', 'office', 'range'],
    columns: [{ key: 'date', title: 'Date' }, { key: 'employee', title: 'Employee' }, { key: 'type', title: 'Type' }, { key: 'hours', title: 'Hours' }, { key: 'status', title: 'Status' }],
  },
  {
    key: 'ptoFunnel', title: 'Request funnel', description: 'Requests by outcome.', filters: ['department', 'office', 'range'],
    columns: [{ key: 'status', title: 'Status' }, { key: 'count', title: 'Requests' }, { key: 'hours', title: 'Hours' }],
  },
  {
    key: 'accrualRuns', title: 'Accrual runs', description: 'Scheduled accrual and year-end runs.', filters: ['range'], hrOnly: true,
    columns: [{ key: '_createdAt', title: 'Ran at' }, { key: 'asOf', title: 'As of' }, { key: 'kind', title: 'Kind' }, { key: 'rowsWritten', title: 'Rows' }, { key: 'outcome', title: 'Outcome' }, { key: 'message', title: 'Message' }],
  },
  {
    key: 'exportEvents', title: 'Export log', description: 'Who exported which report.', filters: [], hrOnly: true,
    columns: [{ key: '_createdAt', title: 'When' }, { key: '_createdBy', title: 'By' }, { key: 'report', title: 'Report' }, { key: 'format', title: 'Format' }, { key: 'rowCount', title: 'Rows' }, { key: 'filters', title: 'Filters' }],
  },
  {
    key: 'auditLog', title: 'Audit log', description: 'Every data change (hr_admin).', filters: ['range'], adminOnly: true,
    columns: [{ key: 'timestamp', title: 'When' }, { key: 'user', title: 'User' }, { key: 'operation', title: 'Operation' }, { key: 'tableId', title: 'Table' }, { key: 'row', title: 'Row' }, { key: 'newValues', title: 'New values' }],
  },
]

type BalanceRow = { employeeNumber: string | null; employee: string | null; office: string | null; balances: { code: string | null; name: string | null; accrued: unknown; used: unknown; expired: unknown; remaining: unknown }[] | null; pending: { code: string | null; hours: unknown }[] | null }

/** One row per employee × type; pending hours matched by type code. */
export function flattenBalances(rows: BalanceRow[]): Row[] {
  return rows.flatMap((r) => {
    const codes = new Set([...(r.balances ?? []).map((b) => b.code), ...(r.pending ?? []).map((p) => p.code)])
    return [...codes].map((code) => {
      const b = r.balances?.find((x) => x.code === code)
      const p = r.pending?.find((x) => x.code === code)
      return {
        employeeNumber: r.employeeNumber, employee: r.employee, office: r.office, type: b?.name ?? code,
        accrued: Number(b?.accrued ?? 0), used: Number(b?.used ?? 0), expired: Number(b?.expired ?? 0), pending: Number(p?.hours ?? 0), remaining: Number(b?.remaining ?? 0),
      }
    })
  })
}

type UsageRow = { employee: string | null; employeeId: string | null; department: string | null; productTeam: string | null; type: string | null; status: string | null; totalHours: unknown; days: unknown }

export function leaveSummary(rows: UsageRow[], groupBy: 'department' | 'productTeam'): Row[] {
  const m = new Map<string, { group: string; type: string; totalHours: number; people: Set<string> }>()
  for (const r of rows.filter((x) => x.status === 'approved')) {
    const group = r[groupBy] ?? '(none)'
    const key = `${group}|${r.type}`
    const e = m.get(key) ?? { group, type: r.type ?? '', totalHours: 0, people: new Set<string>() }
    e.totalHours += Number(r.totalHours ?? 0)
    e.people.add(r.employeeId ?? '')
    m.set(key, e)
  }
  return [...m.values()].map((e) => ({ group: e.group, type: e.type, totalHours: e.totalHours, people: e.people.size })).sort((a, b) => a.group.localeCompare(b.group))
}

export function availability(rows: UsageRow[], from: string, to: string): Row[] {
  return rows
    .filter((r) => r.status === 'approved' || r.status === 'pending')
    .flatMap((r) =>
      (Array.isArray(r.days) ? (r.days as { date: string; hours: number }[]) : [])
        .filter((d) => d.date >= from && d.date <= to)
        .map((d) => ({ date: d.date, employee: r.employee, type: r.type, hours: Number(d.hours), status: r.status })),
    )
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
}
