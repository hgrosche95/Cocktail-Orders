// VITE_API_URL wird beim Produktions-Build gesetzt (Container-App-URL, https).
// Ohne den Wert (lokale Entwicklung/LAN-Nutzung) zeigt die App weiterhin auf
// Port 3001 desselben Hosts, von dem sie geladen wurde.
const API_BASE = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3001`
const API_URL = `${API_BASE}/api`
export const WS_URL = API_BASE.replace(/^http/, 'ws')

/** fetch auf einen API-Pfad, z.B. apiFetch('/orders'). */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, init)
}

// Wirft bei Fehlerstatus, damit kein Fehler-Body (z.B. {"error": ...}) im
// State landet, wo eine Liste erwartet wird.
export function getJson<T>(path: string): Promise<T> {
  return apiFetch(path).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })
}

/** Request mit JSON-Body; die Antwort bleibt dem Aufrufer ueberlassen. */
export function sendJson(
  path: string,
  method: string,
  body: unknown,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  return apiFetch(path, { ...init, method, headers, body: JSON.stringify(body) })
}
