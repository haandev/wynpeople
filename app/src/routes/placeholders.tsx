import { createRoute } from '@tanstack/react-router'
import { Empty } from '../components/ui/ui'
import { HomePage } from '../features/home/HomePage'
import { Directory } from '../features/people/Directory'
import { HireWizard } from '../features/people/HireWizard'
import { OrgChart } from '../features/people/OrgChart'
import { ProfilePage } from '../features/profile/ProfilePage'
import { useMe } from '../lib/useMe'
import { appRoute } from './_app'

// Screens not built yet keep a stable path; later tasks replace them.
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
export const timeOffRoute = page('/time-off', 'Time Off')
export const reportsRoute = page('/reports', 'Reports')
export const settingsRoute = page('/settings', 'Settings')
