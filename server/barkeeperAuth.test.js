import { describe, test, expect } from 'vitest'
import { createBarkeeperToken, isValidBarkeeperToken, passwordMatches } from './barkeeperAuth.js'

describe('passwordMatches', () => {
  test('accepts only the exact password', () => {
    expect(passwordMatches('geheim', 'geheim')).toBe(true)
    expect(passwordMatches('Geheim', 'geheim')).toBe(false)
    expect(passwordMatches('geheim ', 'geheim')).toBe(false)
  })

  test('rejects everything when no password is configured', () => {
    expect(passwordMatches('', undefined)).toBe(false)
    expect(passwordMatches(undefined, undefined)).toBe(false)
  })

  test('rejects non-string input', () => {
    expect(passwordMatches(['geheim'], 'geheim')).toBe(false)
  })
})

describe('barkeeper token', () => {
  const now = Date.UTC(2026, 8, 23, 20)

  test('is valid right after login', () => {
    const token = createBarkeeperToken('geheim', now)
    expect(isValidBarkeeperToken(token, 'geheim', now + 1000)).toBe(true)
  })

  test('expires after 12 hours', () => {
    const token = createBarkeeperToken('geheim', now)
    expect(isValidBarkeeperToken(token, 'geheim', now + 12 * 60 * 60 * 1000 + 1)).toBe(false)
  })

  test('becomes invalid when the barkeeper password changes', () => {
    const token = createBarkeeperToken('alt', now)
    expect(isValidBarkeeperToken(token, 'neu', now)).toBe(false)
  })

  test('cannot be extended by editing the payload', () => {
    const token = createBarkeeperToken('geheim', now)
    const [, signature] = token.split('.')
    const forgedPayload = Buffer.from(
      JSON.stringify({ role: 'barkeeper', exp: now + 365 * 24 * 60 * 60 * 1000 })
    ).toString('base64url')

    expect(isValidBarkeeperToken(`${forgedPayload}.${signature}`, 'geheim', now)).toBe(false)
  })

  test.each([undefined, '', 'kein-token', 'a.b.c'])('rejects %s', (token) => {
    expect(isValidBarkeeperToken(token, 'geheim', now)).toBe(false)
  })
})
