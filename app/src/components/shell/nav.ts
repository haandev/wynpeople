export type Role = 'hr_admin' | 'hr_manager' | 'employee'

export interface Tab {
  to: '/' | '/me' | '/people' | '/time-off' | '/reports' | '/settings'
  label: string
}

export interface NavInput {
  roles: readonly string[]
  isManager?: boolean
}

const BASE_TABS: Tab[] = [
  { to: '/', label: 'Home' },
  { to: '/me', label: 'My Info' },
  { to: '/people', label: 'People' },
  { to: '/time-off', label: 'Time Off' },
  { to: '/reports', label: 'Reports' },
]

export const isHr = (roles: readonly string[]) => roles.includes('hr_admin') || roles.includes('hr_manager')

/** The top tabs a person sees: Settings only for HR roles. */
export function navFor(me: NavInput): Tab[] {
  return isHr(me.roles) ? [...BASE_TABS, { to: '/settings', label: 'Settings' }] : BASE_TABS
}
