import { createRouter } from '@tanstack/react-router'
import { rootRoute } from './routes/__root'
import { appRoute } from './routes/_app'
import { loginRoute } from './routes/login'
import { homeRoute, meRoute, peopleRoute, reportsRoute, settingsRoute, timeOffRoute } from './routes/placeholders'
import { setRouter } from './router-ref'

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([homeRoute, meRoute, peopleRoute, timeOffRoute, reportsRoute, settingsRoute]),
])

export const router = createRouter({ routeTree })
setRouter(router)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
