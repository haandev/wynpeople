import { createRoute } from '@tanstack/react-router'
import { getRouter } from '../router-ref'
import { session } from '../wyndbase'
import { rootRoute } from './__root'

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  ...session.signInRouteOptions(getRouter),
  component: () => (
    <div className="grid min-h-screen place-items-center">
      <p className="text-sm text-stone-500">Signing you in…</p>
    </div>
  ),
})
