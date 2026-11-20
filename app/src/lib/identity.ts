import { wyndbase } from '../wyndbase'

/**
 * An address on the Wyndbase identity pages for this app's base, built from what the
 * SDK knows (server and base), never hard-coded: createIdentityUrl('account') →
 * https://dev.wyndbase.dev/account?tenant=wynpeople
 */
export function createIdentityUrl(path: string): string {
  const url = new URL(path.replace(/^\/+/, ''), `${wyndbase.serverUrl.replace(/\/+$/, '')}/`)
  url.searchParams.set('tenant', wyndbase.baseRef)
  return url.toString()
}
