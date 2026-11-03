import { useCallback, useState } from 'react'
import { apiFetch, sendJson } from '../api'

/**
 * Barkeeper-Anmeldung. Das Token vom Server ist der eigentliche Nachweis:
 * die Barkeeper-Routen pruefen es, ein reines "isBarkeeper"-Flag im Browser
 * haette jeder setzen koennen.
 */
export function useBarkeeperAuth() {
  const [barkeeperToken, setBarkeeperToken] = useState(
    () => sessionStorage.getItem('barkeeperToken')
  )

  function login(password: string): Promise<boolean> {
    return sendJson('/barkeeper-login', 'POST', { password })
      .then((res) => res.json())
      .then((data: { success: boolean; token?: string }) => {
        if (data.success && data.token) {
          sessionStorage.setItem('barkeeperToken', data.token)
          setBarkeeperToken(data.token)
          return true
        }
        return false
      })
  }

  /** fetch mit Token; bei 401 wird der Barkeeper abgemeldet. */
  const barkeeperFetch = useCallback(
    (path: string, init: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(init.headers)
      headers.set('Authorization', `Bearer ${barkeeperToken}`)
      return apiFetch(path, { ...init, headers }).then((res) => {
        // Token abgelaufen (nach 12 h) oder Passwort geaendert: neu anmelden.
        if (res.status === 401) {
          sessionStorage.removeItem('barkeeperToken')
          setBarkeeperToken(null)
        }
        return res
      })
    },
    [barkeeperToken]
  )

  return { isBarkeeperAuthenticated: barkeeperToken !== null, login, barkeeperFetch }
}
