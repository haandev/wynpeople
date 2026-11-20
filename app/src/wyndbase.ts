import { wyndbaseSDK } from '@wyndbase/sdk/core'
import { Inbox } from '@wyndbase/sdk/plugins/inbox'
import { Storage } from '@wyndbase/sdk/plugins/storage'
import { browserSession } from '@wyndbase/sdk/session/browser'
import type { WdbTypes } from '../wynpeople.wql.gen'
import { loginPath, loginUrl, url } from './config'

// Every sign-in returns to the login route, whichever page started it: the one
// registered callback, so every browser converges on one client instead of
// registering one per page.
export const session = browserSession({
  autoRegister: true,
  redirectUri: loginPath,
})

export const wyndbase = new wyndbaseSDK<WdbTypes>(url, {
  onUnauthorized: () => {
    window.location.assign(loginUrl())
  },
  session,
})
  .use(Inbox)
  .use(Storage)

declare module '@wyndbase/sdk/react' {
  interface Register {
    sdk: typeof wyndbase
  }
}
