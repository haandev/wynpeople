import { createRoute } from '@tanstack/react-router'
import { appRoute } from './_app'

// Screens are filled in by later tasks; each route keeps its path stable.
const page = <P extends string>(path: P, title: string) =>
  createRoute({
    getParentRoute: () => appRoute,
    path,
    component: () => (
      <section>
        <h1 className="text-2xl font-semibold text-stone-800">{title}</h1>
      </section>
    ),
  })

export const homeRoute = page('/', 'Home')
export const meRoute = page('/me', 'My Info')
export const peopleRoute = page('/people', 'People')
export const timeOffRoute = page('/time-off', 'Time Off')
export const reportsRoute = page('/reports', 'Reports')
export const settingsRoute = page('/settings', 'Settings')
