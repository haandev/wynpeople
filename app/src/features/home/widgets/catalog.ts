import type { ComponentType } from 'react'
import type { Role } from '../../../components/shell/nav'
import { AnnouncementsWidget } from './announcements'
import { TimeOffWidget } from './timeOffWidget'
import {
  ApprovalsWidget,
  CelebrationsWidget,
  DepartmentWidget,
  EmploymentTypeWidget,
  LinksWidget,
  NewHiresWidget,
  OfficeWidget,
  TenureWidget,
  TimeOffUsedWidget,
  WhosOutWidget,
  WithoutPayRaiseWidget,
} from './widgets'

export interface WidgetDef {
  id: string
  title: string
  icon: string
  description: string
  component: ComponentType
  /** Grid size in a 12-column grid (rows are ROW_HEIGHT px). */
  w: number
  h: number
  minW?: number
  minH?: number
  /** Only these roles may add it. Where the data is sensitive the server refuses it to anyone else too. */
  roles?: Role[]
}

export const ROW_HEIGHT = 40

export const WIDGETS: WidgetDef[] = [
  { id: 'balances', title: 'Time off', icon: '🗓️', description: 'Your hours available and booked, with a balance calculator.', component: TimeOffWidget, w: 4, h: 7, minW: 3, minH: 6 },
  { id: 'announcements', title: "What's happening", icon: '📣', description: 'Company announcements from HR.', component: AnnouncementsWidget, w: 8, h: 7, minW: 4, minH: 5 },
  { id: 'approvals', title: 'My approvals', icon: '✅', description: 'Requests waiting for your decision.', component: ApprovalsWidget, w: 8, h: 7, minW: 4, minH: 4 },
  { id: 'whosOut', title: "Who's out", icon: '🌴', description: 'Who is away today, and how many from your office.', component: WhosOutWidget, w: 4, h: 7, minW: 3, minH: 5 },
  { id: 'celebrations', title: 'Celebrations', icon: '🎉', description: 'Birthdays and work anniversaries this month.', component: CelebrationsWidget, w: 4, h: 9, minW: 3, minH: 5 },
  { id: 'newHires', title: 'New team members', icon: '👋', description: 'Everyone who joined in the last 30 days.', component: NewHiresWidget, w: 4, h: 9, minW: 3, minH: 5 },
  { id: 'links', title: 'Company links', icon: '🔗', description: 'Handbook, benefits and other links HR shares.', component: LinksWidget, w: 4, h: 9, minW: 3, minH: 4 },
  { id: 'timeOffUsed', title: 'Time off used', icon: '📅', description: 'Approved days off per month, by type, for you and the people you look after.', component: TimeOffUsedWidget, w: 8, h: 8, minW: 4, minH: 6 },
  { id: 'withoutPayRaise', title: 'People without a pay raise', icon: '💸', description: 'People whose pay has not changed for 12+ months.', component: WithoutPayRaiseWidget, w: 4, h: 8, minW: 3, minH: 5, roles: ['hr_admin', 'hr_manager'] },
  { id: 'department', title: 'Department', icon: '👥', description: 'Headcount by department.', component: DepartmentWidget, w: 4, h: 8, minW: 3, minH: 6 },
  { id: 'office', title: 'Office', icon: '🏢', description: 'Headcount by office.', component: OfficeWidget, w: 4, h: 8, minW: 3, minH: 6 },
  { id: 'tenure', title: 'Length of service', icon: '⏳', description: 'Headcount by years at the company.', component: TenureWidget, w: 4, h: 8, minW: 3, minH: 6, roles: ['hr_admin', 'hr_manager'] },
  { id: 'employmentType', title: 'Employment type', icon: '🪪', description: 'Full-time and part-time headcount.', component: EmploymentTypeWidget, w: 4, h: 8, minW: 3, minH: 6, roles: ['hr_admin', 'hr_manager'] },
]

export const widgetById = new Map(WIDGETS.map((w) => [w.id, w]))

export const allowedFor = (roles: Role[]) => WIDGETS.filter((w) => !w.roles || w.roles.some((r) => roles.includes(r)))

export interface Placed {
  i: string
  x: number
  y: number
  w: number
  h: number
}

/** The layout someone starts with: the widgets for their role, packed row by row. */
export function defaultLayout(roles: Role[]): Placed[] {
  const hr = roles.includes('hr_admin') || roles.includes('hr_manager')
  const ids = hr
    ? ['balances', 'announcements', 'approvals', 'whosOut', 'celebrations', 'newHires', 'withoutPayRaise', 'timeOffUsed', 'links', 'department', 'office', 'tenure']
    : ['balances', 'announcements', 'approvals', 'whosOut', 'celebrations', 'newHires', 'links', 'timeOffUsed', 'department']
  return pack(ids)
}

/** Places widgets left to right, wrapping at 12 columns. */
export function pack(ids: string[], startY = 0): Placed[] {
  let x = 0
  let y = startY
  let rowH = 0
  const out: Placed[] = []
  for (const id of ids) {
    const d = widgetById.get(id)
    if (!d) continue
    if (x + d.w > 12) {
      x = 0
      y += rowH
      rowH = 0
    }
    out.push({ i: id, x, y, w: d.w, h: d.h })
    x += d.w
    rowH = Math.max(rowH, d.h)
  }
  return out
}
