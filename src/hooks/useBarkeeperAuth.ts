import { useCallback, useState } from 'react'
import { apiFetch, sendJson } from '../api'

const DEMO_KEY = 'barkeeperDemo'

/**
 * Barkeeper-Anmeldung. Das Token vom Server ist der eigentliche Nachweis:
 * die Barkeeper-Routen pruefen es, ein reines "isBarkeeper"-Flag im Browser
 * haette jeder setzen koennen.
 */
export function useBarkeeperAuth() {
  const [barkeeperToken, setBarkeeperToken] = useState(
    () => sessionStorage.getItem('barkeeperToken')
  )
  // Demo nur im Frontend: die Theke darf jemand ohne Token lesen, weil ihre
  // Lese-Routen oeffentlich sind. sessionStorage statt localStorage, damit der
  // Modus einen Reload ueberlebt, aber mit dem Tab endet.
  const [isDemo, setIsDemo] = useState(() => sessionStorage.getItem(DEMO_KEY) === '1')

  function login(password: string): Promise<boolean> {
    return sendJson('/barkeeper-login', 'POST', { password })
      .then((res) => res.json())
      .then((data: { success: boolean; token?: string }) => {
        if (data.success && data.token) {
          sessionStorage.setItem('barkeeperToken', data.token)
          // Echte Anmeldung hat immer Vorrang vor der Demo.
          sessionStorage.removeItem(DEMO_KEY)
          setIsDemo(false)
          setBarkeeperToken(data.token)
          return true
        }
        return false
      })
  }

  /** Demo-Modus starten: kein Token, daher nur Lesezugriff auf die Theke. */
  function startDemo() {
    sessionStorage.setItem(DEMO_KEY, '1')
    setIsDemo(true)
  }

  /** Demo-Modus beenden; das Flag muss weg, sonst bleibt die Theke nach dem Abmelden offen. */
  function endDemo() {
    sessionStorage.removeItem(DEMO_KEY)
    setIsDemo(false)
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

  return {
    isBarkeeperAuthenticated: barkeeperToken !== null,
    isDemo,
    login,
    startDemo,
    endDemo,
    barkeeperFetch,
  }
}
