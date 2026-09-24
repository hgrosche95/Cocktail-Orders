import { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, NavLink, Link, useMatch } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import BarkeeperLogin from './components/BarkeeperLogin'
import CustomerPage from './pages/CustomerPage'
import BarkeeperPage from './pages/BarkeeperPage'
import Skyline from './components/Skyline'
import DrinkPage from './pages/DrinkPage'
import cocktails from './data/cocktails'
import type { Cocktail } from './data/cocktails'
import type { OrderItem, SubmittedOrder, Recommendation } from './types'

// VITE_API_URL wird beim Produktions-Build gesetzt (Container-App-URL, https).
// Ohne den Wert (lokale Entwicklung/LAN-Nutzung) zeigt die App weiterhin auf
// Port 3001 desselben Hosts, von dem sie geladen wurde.
const API_BASE = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3001`
const API_URL = `${API_BASE}/api`
const WS_URL = API_BASE.replace(/^http/, 'ws')

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function App() {
  const [order, setOrder] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('order')
    return saved ? JSON.parse(saved) : []
  })

  const [openOrders, setOpenOrders] = useState<SubmittedOrder[]>([])
  const [unavailableIngredients, setUnavailableIngredients] = useState<string[]>([])
  const [history, setHistory] = useState<SubmittedOrder[]>([])
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [dismissedHistoryOrderId, setDismissedHistoryOrderId] = useState<string | null>(null)
  const [textRecommendations, setTextRecommendations] = useState<Recommendation[]>([])
  const [isTextRecommending, setIsTextRecommending] = useState(false)
  const [wishNote, setWishNote] = useState('')
  // Nur fuer die aktuelle Sitzung (kein localStorage) - bei Neuladen der
  // Seite wird es einfach erneut versucht. Ein Groq-Tageslimit ist am
  // naechsten Tag ohnehin wieder frei, ein dauerhaftes Abschalten braucht es
  // dafuer nicht.
  const [isWishFeatureDisabled, setIsWishFeatureDisabled] = useState(false)

  const [currentUser, setCurrentUser] = useState(
    () => localStorage.getItem('currentUser') ?? ''
  )
  const currentUserRef = useRef(currentUser)

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  const fetchHistory = useCallback((guest: string) => {
    fetch(`${API_URL}/orders/history?guest=${encodeURIComponent(guest)}`)
      .then((res) => res.json())
      .then((data: SubmittedOrder[]) => setHistory(data))
  }, [])

  const fetchRatings = useCallback((guest: string) => {
    fetch(`${API_URL}/ratings?guest=${encodeURIComponent(guest)}`)
      .then((res) => res.json())
      .then((data: { cocktailId: number; rating: number }[]) => {
        const map: Record<number, number> = {}
        for (const { cocktailId, rating } of data) map[cocktailId] = rating
        setRatings(map)
      })
  }, [])

  const fetchRecommendations = useCallback((guest: string) => {
    fetch(`${API_URL}/recommendations?guest=${encodeURIComponent(guest)}`)
      .then((res) => res.json())
      .then((data: Recommendation[]) => setRecommendations(data))
  }, [])

  useEffect(() => {
    function fetchOpenOrders() {
      fetch(`${API_URL}/orders`)
        .then((res) => res.json())
        .then((data: SubmittedOrder[]) => setOpenOrders(data))
    }

    function fetchUnavailableIngredients() {
      fetch(`${API_URL}/unavailable-ingredients`)
        .then((res) => res.json())
        .then((data: string[]) => setUnavailableIngredients(data))
    }

    fetchOpenOrders()
    fetchUnavailableIngredients()

    const socket = new WebSocket(WS_URL)

    socket.addEventListener('message', () => {
      fetchOpenOrders()
      fetchUnavailableIngredients()

      // Betrifft z.B. den Fall, dass der Barkeeper gerade diese Bestellung
      // fertig markiert hat - die Historie muss das mitbekommen, damit der
      // Bewertungs-Prompt fuer den neu abgeholten Cocktail erscheint.
      if (currentUserRef.current) {
        fetchHistory(currentUserRef.current)
        fetchRatings(currentUserRef.current)
        fetchRecommendations(currentUserRef.current)
      }
    })

    return () => socket.close()
  }, [fetchHistory, fetchRatings, fetchRecommendations])

  useEffect(() => {
    if (!currentUser) return
    fetchHistory(currentUser)
    fetchRatings(currentUser)
    fetchRecommendations(currentUser)
  }, [currentUser, fetchHistory, fetchRatings, fetchRecommendations])

  useEffect(() => {
    localStorage.setItem('order', JSON.stringify(order))
  }, [order])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', currentUser)
    } else {
      localStorage.removeItem('currentUser')
    }
  }, [currentUser])

  const orderFormRef = useRef<HTMLDivElement>(null)

  function handleAddToOrder(cocktail: Cocktail) {
    const orderItem: OrderItem = { ...cocktail, orderId: generateId() }
    setOrder([orderItem])
    orderFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleOrderNow(cocktail: Cocktail, note: string) {
    handleSubmitOrder(note, [{ ...cocktail, orderId: generateId() }])
  }

  function handleRemoveItem(orderId: string) {
    setOrder((prevOrder) => prevOrder.filter((item) => item.orderId !== orderId))
  }

  // Die Position in der Schlange ist die Reihenfolge, in der der Server die
  // offenen Bestellungen liefert - dieselbe, die auch die Theke sieht.
  const ownOrderIndex = openOrders.findIndex((o) => o.name === currentUser)
  const ownOpenOrder = ownOrderIndex === -1 ? null : openOrders[ownOrderIndex]
  const hasOpenOrder = ownOpenOrder !== null

  const [showReadyNotification, setShowReadyNotification] = useState(false)
  const previousHasOpenOrder = useRef(false)

  useEffect(() => {
    if (previousHasOpenOrder.current && !hasOpenOrder) {
      setShowReadyNotification(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    previousHasOpenOrder.current = hasOpenOrder
  }, [hasOpenOrder])

  // items ist optional: die Karte schickt die vorgemerkte Bestellung ab, die
  // Detailansicht eines Drinks bestellt ihn direkt, ohne Umweg ueber `order`
  // (ein setOrder direkt vor dem fetch waere hier noch nicht angekommen).
  function handleSubmitOrder(note: string, items: OrderItem[] = order) {
    if (hasOpenOrder) return

    fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: currentUser, items, note }),
    })
      // 409 = Server kennt schon eine offene Bestellung dieses Gasts (z.B. aus
      // einem zweiten Tab), dann nichts in die lokale Liste uebernehmen.
      .then((res) => (res.ok ? res.json() : null))
      .then((newOrder: SubmittedOrder | null) => {
        if (!newOrder) return
        setOpenOrders((prevOpenOrders) => [...prevOpenOrders, newOrder])
        setOrder([])
      })
  }

  // Das Token vom Server ist der eigentliche Nachweis: die Barkeeper-Routen
  // pruefen es, ein reines "isBarkeeper"-Flag im Browser haette jeder setzen
  // koennen.
  const [barkeeperToken, setBarkeeperToken] = useState(
    () => sessionStorage.getItem('barkeeperToken')
  )
  const isBarkeeperAuthenticated = barkeeperToken !== null

  function barkeeperFetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${barkeeperToken}`)
    return fetch(`${API_URL}${path}`, { ...init, headers }).then((res) => {
      // Token abgelaufen (nach 12 h) oder Passwort geaendert: neu anmelden.
      if (res.status === 401) {
        sessionStorage.removeItem('barkeeperToken')
        setBarkeeperToken(null)
      }
      return res
    })
  }

  function handleBarkeeperLogin(password: string): Promise<boolean> {
    return fetch(`${API_URL}/barkeeper-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
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

  function handleMarkAsDone(orderId: string) {
    barkeeperFetch(`/orders/${orderId}/complete`, {
      method: 'PATCH',
    }).then((res) => {
      if (!res.ok) return
      setOpenOrders((prevOpenOrders) =>
        prevOpenOrders.filter((o) => o.orderId !== orderId)
      )
    })
  }

  function handleRateCocktail(cocktailId: number, rating: number) {
    fetch(`${API_URL}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestName: currentUser, cocktailId, rating }),
    }).then(() => {
      setRatings((prev) => ({ ...prev, [cocktailId]: rating }))
      fetchRecommendations(currentUser)
    })
  }

  function handleDismissRatingPrompt(orderId: string) {
    setDismissedHistoryOrderId(orderId)
  }

  function handleWishSubmit(text: string) {
    setIsTextRecommending(true)
    fetch(`${API_URL}/recommend-by-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then((res) => {
        // Groq-Tages-/Ratenlimit erreicht (siehe app.js) - Feature fuer den
        // Rest dieser Sitzung deaktivieren statt bei jedem weiteren Versuch
        // erneut ins Leere zu laufen.
        if (res.status === 429) {
          setIsWishFeatureDisabled(true)
          return null
        }
        return res.json()
      })
      .then((result: { cocktailIds: number[]; note: string | null } | null) => {
        if (!result) return

        // Nicht verfuegbare Cocktails rausfiltern, bevor entschieden wird, ob
        // es "genau ein Treffer" ist - sonst koennte ein ausverkaufter
        // Cocktail automatisch in die Bestellung wandern.
        const availableCocktails = result.cocktailIds
          .map((id) => cocktails.find((c) => c.id === id))
          .filter((cocktail): cocktail is Cocktail => cocktail !== undefined)
          .filter(
            (cocktail) =>
              !cocktail.ingredients.some((ingredient) => unavailableIngredients.includes(ingredient))
          )

        if (availableCocktails.length === 1) {
          handleAddToOrder(availableCocktails[0])
          setWishNote(result.note ?? '')
          setTextRecommendations([])
          return
        }

        setTextRecommendations(
          availableCocktails.map((cocktail) => ({ cocktailId: cocktail.id, predictedRating: 0 }))
        )
      })
      .catch(() => setTextRecommendations([]))
      .finally(() => setIsTextRecommending(false))
  }

  const latestCompletedOrder = history[0]
  const pendingRatingItem =
    latestCompletedOrder &&
    latestCompletedOrder.orderId !== dismissedHistoryOrderId &&
    latestCompletedOrder.items[0] &&
    ratings[latestCompletedOrder.items[0].id] === undefined
      ? { orderId: latestCompletedOrder.orderId, item: latestCompletedOrder.items[0] }
      : null

  function handleMarkIngredientUnavailable(ingredient: string) {
    barkeeperFetch(`/unavailable-ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient }),
    }).then((res) => {
      if (!res.ok) return
      setUnavailableIngredients((prev) => [...prev, ingredient])
    })
  }

  function handleMarkIngredientAvailable(ingredient: string) {
    barkeeperFetch(`/unavailable-ingredients`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient }),
    }).then((res) => {
      if (!res.ok) return
      setUnavailableIngredients((prev) => prev.filter((i) => i !== ingredient))
    })
  }

  const drinkMatch = useMatch('/drink/:id')
  const detailCocktail = drinkMatch
    ? cocktails.find((cocktail) => String(cocktail.id) === drinkMatch.params.id)
    : undefined
  const barkeeperMatch = useMatch('/barkeeper')
  const isArrival = currentUser === '' && !barkeeperMatch

  return (
    <div>
      {/* Der Header ist die Buehne ueber der Skyline und wechselt mit der
          Ansicht: Ankunft (noch nicht angemeldet), Drink-Detail oder die
          normale Marke. */}
      <header className={isArrival ? 'app-header app-header-arrival' : 'app-header'}>
        <div className="app-header-inner">
          {isArrival ? (
            <>
              <span className="lift-display">▲ 5 · Dachterrasse</span>
              <h1 className="arrival-title">
                Über den Dächern <span>von Düsseldorf.</span>
              </h1>
              <p className="app-coords">51°14′ N · 6°46′ O · Etage 5</p>
            </>
          ) : detailCocktail ? (
            <>
              <Link to="/" className="back-link">
                ← Karte
              </Link>
              <h1 className="drink-title">{detailCocktail.name}</h1>
            </>
          ) : (
            <>
              <h1>
                Rooftop <span className="app-floor">5. OG</span>
              </h1>
              <p className="app-subtitle">Cocktails über Düsseldorf</p>
            </>
          )}
        </div>
        <Skyline className="app-skyline" />
      </header>

      {showReadyNotification && (
        <div className="notification">
          <p>
            <span className="notification-dot" aria-hidden="true" /> Deine Bestellung ist fertig!
          </p>
          <button type="button" className="btn" onClick={() => setShowReadyNotification(false)}>
            Schließen
          </button>
        </div>
      )}

      <nav className="tabs">
        {/* Kunde bleibt auch in der Drink-Detailansicht markiert */}
        <NavLink to="/" className={barkeeperMatch ? 'tab' : 'tab active'}>
          Kunde
        </NavLink>
        <NavLink
          to="/barkeeper"
          className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
        >
          Barkeeper
        </NavLink>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            currentUser === '' ? (
              <LoginForm onLogin={setCurrentUser} />
            ) : (
              <CustomerPage
                order={order}
                onAddToOrder={handleAddToOrder}
                onRemoveItem={handleRemoveItem}
                onSubmitOrder={handleSubmitOrder}
                hasOpenOrder={hasOpenOrder}
                ownOpenOrder={ownOpenOrder}
                queuePosition={ownOrderIndex + 1}
                orderFormRef={orderFormRef}
                queueLength={openOrders.length}
                unavailableIngredients={unavailableIngredients}
                history={history}
                ratings={ratings}
                recommendations={recommendations}
                pendingRatingItem={pendingRatingItem}
                onRateCocktail={handleRateCocktail}
                onDismissRatingPrompt={handleDismissRatingPrompt}
                textRecommendations={textRecommendations}
                isTextRecommending={isTextRecommending}
                onWishSubmit={handleWishSubmit}
                wishNote={wishNote}
                isWishFeatureDisabled={isWishFeatureDisabled}
              />
            )
          }
        />
        <Route
          path="/drink/:id"
          element={
            currentUser === '' ? (
              <LoginForm onLogin={setCurrentUser} />
            ) : (
              <DrinkPage
                cocktail={detailCocktail}
                onOrder={handleOrderNow}
                hasOpenOrder={hasOpenOrder}
                queueLength={openOrders.length}
                unavailableIngredients={unavailableIngredients}
              />
            )
          }
        />
        <Route
          path="/barkeeper"
          element={
            isBarkeeperAuthenticated ? (
              <BarkeeperPage
                openOrders={openOrders}
                onMarkAsDone={handleMarkAsDone}
                unavailableIngredients={unavailableIngredients}
                onMarkIngredientUnavailable={handleMarkIngredientUnavailable}
                onMarkIngredientAvailable={handleMarkIngredientAvailable}
              />
            ) : (
              <BarkeeperLogin onLogin={handleBarkeeperLogin} />
            )
          }
        />
      </Routes>
    </div>
  )
}

export default App
