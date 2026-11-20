import { createRoute, Outlet, redirect, useRouterState } from '@tanstack/react-router'
import { TopBar } from '../components/shell/TopBar'
import { SkeletonShell } from '../components/ui/Skeleton'
import { useMe } from '../lib/useMe'
import { wyndbase } from '../wyndbase'
import { rootRoute } from './__root'

export const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: ({ location }) => {
    if (!wyndbase.auth.isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const { me, isLoading, error } = useMe()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (error) return <Centered>Could not load your profile: {String((error as Error).message ?? error)}</Centered>
  if (isLoading || !me) return <SkeletonShell />
  return (
    <div className="min-h-screen">
      <TopBar me={me} />
      {/* Keyed by path so every page change fades in. */}
      <main key={pathname} className="mx-auto max-w-7xl animate-fade-up px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center text-sm text-stone-500">{children}</div>
}
