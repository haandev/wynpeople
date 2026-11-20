import { wyndbase } from '../wyndbase'

/** Clears this application's tokens and returns to the login route. */
export function signOut(): void {
  wyndbase.auth.logout({ scope: 'app' })
  window.location.assign('/login')
}
