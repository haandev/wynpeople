import { createRoute } from '@tanstack/react-router'
import { Empty } from '../components/ui/ui'
import { HomePage } from '../features/home/HomePage'
import { Directory } from '../features/people/Directory'
import { HireWizard } from '../features/people/HireWizard'
import { OrgChart } from '../features/people/OrgChart'
import { TimeOffPage } from '../features/timeoff/TimeOffPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { useMe } from '../lib/useMe'
import { appRoute } from './_app'

export const homeRoute = createRoute({ getParentRoute: () => appRoute, path: '/', component: HomePage })
export const meRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/me',
  component: function Me() {
    const { me } = useMe()
    return me?.employeeId ? <ProfilePage employeeId={me.employeeId} /> : <Empty>You have no employee record.</Empty>
  },
})
export const personRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/people/$employeeId',
  component: function Person() {
    const { employeeId } = personRoute.useParams()
    return <ProfilePage key={employeeId} employeeId={employeeId} />
  },
})
export const peopleRoute = createRoute({ getParentRoute: () => appRoute, path: '/people', component: Directory })
export const orgChartRoute = createRoute({ getParentRoute: () => appRoute, path: '/people/org-chart', component: OrgChart })
export const hireRoute = createRoute({ getParentRoute: () => appRoute, path: '/people/new', component: HireWizard })
export const timeOffRoute = createRoute({ getParentRoute: () => appRoute, path: '/time-off', component: TimeOffPage })
export const reportsRoute = createRoute({ getParentRoute: () => appRoute, path: '/reports', component: ReportsPage })
export const settingsRoute = createRoute({ getParentRoute: () => appRoute, path: '/settings', component: SettingsPage })
