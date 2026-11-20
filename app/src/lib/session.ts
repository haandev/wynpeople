import { wyndbase } from '../wyndbase'

/**
 * Signs out with the SDK's default behavior: with no scope the session decides
 * (`defaultLogoutScope`), which for this client also ends the Wyndbase sign-in.
 * Waits for the logout to finish, then returns to the login route.
 */
export async function signOut(): Promise<void> {
  try {
    await wyndbase.auth.logout()
  } finally {
    window.location.assign('/login')
  }
}
