// WebSocket zum Server, das sich nach einem Abbruch selbst neu verbindet.
// Abbrueche sind im Betrieb normal: der Container schlaeft bei Scale-to-Zero
// ein, Proxies trennen ruhende Verbindungen, Handys frieren Hintergrund-Tabs
// ein. Ohne Neuverbindung bekaeme die Seite danach still keine Updates mehr
// (auch nicht die "fertig"-Meldung).

const INITIAL_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 30_000

interface LiveUpdateHandlers {
  // Server meldet eine Aenderung.
  onChange: () => void
  // Verbindung nach einem Abbruch wieder da. Waehrend der Pause koennen
  // Aenderungen verpasst worden sein, deshalb hier einmal alles neu laden.
  onReconnect: () => void
}

/** Baut die Verbindung auf und gibt eine Funktion zum endgueltigen Trennen zurueck. */
export function connectLiveUpdates(
  url: string,
  { onChange, onReconnect }: LiveUpdateHandlers
): () => void {
  let socket: WebSocket
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retryDelay = INITIAL_RETRY_DELAY_MS
  let hasConnectedBefore = false
  let isStopped = false

  function connect() {
    retryTimer = undefined
    socket = new WebSocket(url)

    socket.addEventListener('open', () => {
      retryDelay = INITIAL_RETRY_DELAY_MS
      if (hasConnectedBefore) onReconnect()
      hasConnectedBefore = true
    })

    socket.addEventListener('message', () => onChange())

    // Folgt auch auf jeden 'error', deshalb reicht dieser eine Handler.
    socket.addEventListener('close', () => {
      if (isStopped) return
      retryTimer = setTimeout(connect, retryDelay)
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS)
    })
  }

  // Kommt ein eingefrorener Tab zurueck in den Vordergrund, nicht erst den
  // (evtl. 30 s langen) Backoff abwarten.
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && retryTimer !== undefined) {
      clearTimeout(retryTimer)
      connect()
    }
  }

  connect()
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    isStopped = true
    clearTimeout(retryTimer)
    document.removeEventListener('visibilitychange', handleVisibilityChange)

    // React-StrictMode startet den Effekt in der Entwicklung zweimal. Ein
    // close() mitten im Verbindungsaufbau meldet der Browser als Warnung,
    // deshalb dann erst nach dem Aufbau schliessen.
    const current = socket
    if (current.readyState === WebSocket.CONNECTING) {
      current.addEventListener('open', () => current.close())
    } else {
      current.close()
    }
  }
}
