import { session, wyndbase } from '../wyndbase'

/**
 * An address on the Wyndbase identity pages for this app's base, built from what the
 * SDK knows, never hard-coded: the server and base from the SDK, and the client from the
 * session (`clientId()` is the id the sign-in actually carries — the registered one once
 * the session has registered this app, the address's name before). The identity pages use
 * `client` to know which application sent the person:
 * createIdentityUrl('account') → https://dev.wyndbase.dev/account?tenant=wynpeople&client=<id>
 */
export function createIdentityUrl(path: string): string {
  const url = new URL(path.replace(/^\/+/, ''), `${wyndbase.serverUrl.replace(/\/+$/, '')}/`)
  url.searchParams.set('tenant', wyndbase.baseRef)
  const client = session.clientId()
  if (client) url.searchParams.set('client', client)
  return url.toString()
}
