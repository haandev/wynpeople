import { createRoute } from '@tanstack/react-router'
import { getRouter } from '../router-ref'
import { WynPeopleBrand } from '../components/ui/Brand'
import { session } from '../wyndbase'
import { rootRoute } from './__root'

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  ...session.signInRouteOptions(getRouter),
  component: () => (
    <div className="grid min-h-screen place-items-center">
      <div className="flex animate-fade-up flex-col items-center gap-4">
        <span className="text-stone-900">
          <WynPeopleBrand size={40} />
        </span>
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          Signing you in…
        </div>
      </div>
    </div>
  ),
})
