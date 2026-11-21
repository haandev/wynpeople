import { describe, expect, it } from 'vitest'
import { REQUIRED, usernameFromEmail } from './hireForm'

describe('new employee form', () => {
  it('requires a username on the Personal step (people sign in with it)', () => {
    expect(REQUIRED.Personal).toContain('username')
  })

  it('suggests the username from the part of the work email before @', () => {
    expect(usernameFromEmail('Beyza.Koroglu@wynenterprise.io')).toBe('beyza.koroglu')
  })

  it('suggests nothing until the email has an @', () => {
    expect(usernameFromEmail('beyza')).toBe('')
  })
})
