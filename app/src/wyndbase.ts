import { wyndbaseSDK } from '@wyndbase/sdk/core'
import { Inbox } from '@wyndbase/sdk/plugins/inbox'
import { browserSession } from '@wyndbase/sdk/session/browser'
import type { WdbTypes } from '../wynpeople.wql.gen'
import { loginUrl, url } from './config'

export const session = browserSession({ autoRegister: true })

export const wyndbase = new wyndbaseSDK<WdbTypes>(url, {
  onUnauthorized: () => {
    window.location.assign(loginUrl())
  },
  session,
}).use(Inbox)

declare module '@wyndbase/sdk/react' {
  interface Register {
    sdk: typeof wyndbase
  }
}
