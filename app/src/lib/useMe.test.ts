import { describe, expect, it } from 'vitest'
import { navFor } from '../components/shell/nav'

describe('navFor', () => {
  it('gives an employee the five tabs without Settings', () => {
    const tabs = navFor({ roles: ['employee'], isManager: false })
    expect(tabs.map((t) => t.to)).toEqual(['/', '/me', '/people', '/time-off', '/reports'])
  })

  it('adds Settings for an hr_manager', () => {
    const tabs = navFor({ roles: ['hr_manager'], isManager: false })
    expect(tabs.map((t) => t.label)).toContain('Settings')
  })

  it('adds Settings for an hr_admin', () => {
    expect(navFor({ roles: ['hr_admin', 'employee'], isManager: false }).at(-1)?.to).toBe('/settings')
  })
})
