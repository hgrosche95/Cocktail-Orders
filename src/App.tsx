import { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import BarkeeperLogin from './components/BarkeeperLogin'
import CustomerPage from './pages/CustomerPage'
import BarkeeperPage from './pages/BarkeeperPage'
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

  function handleRemoveItem(orderId: string) {
    setOrder((prevOrder) => prevOrder.filter((item) => item.orderId !== orderId))
  }

  const hasOpenOrder = openOrders.some((o) => o.name === currentUser)

  const [showReadyNotification, setShowReadyNotification] = useState(false)
  const previousHasOpenOrder = useRef(false)

  useEffect(() => {
    if (previousHasOpenOrder.current && !hasOpenOrder) {
      setShowReadyNotification(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    previousHasOpenOrder.current = hasOpenOrder
  }, [hasOpenOrder])

  function handleSubmitOrder(note: string) {
    if (hasOpenOrder) return

    fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: currentUser, items: order, note }),
    })
      .then((res) => res.json())
      .then((newOrder: SubmittedOrder) => {
        setOpenOrders((prevOpenOrders) => [...prevOpenOrders, newOrder])
        setOrder([])
      })
  }

  const [isBarkeeperAuthenticated, setIsBarkeeperAuthenticated] = useState(
    () => sessionStorage.getItem('isBarkeeper') === 'true'
  )

  function handleBarkeeperLogin(password: string): Promise<boolean> {
    return fetch(`${API_URL}/barkeeper-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
      .then((res) => res.json())
      .then((data: { success: boolean }) => {
        if (data.success) {
          sessionStorage.setItem('isBarkeeper', 'true')
          setIsBarkeeperAuthenticated(true)
        }
        return data.success
      })
  }

  function handleMarkAsDone(orderId: string) {
    fetch(`${API_URL}/orders/${orderId}/complete`, {
      method: 'PATCH',
    }).then(() => {
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
      body: JSON.stringify({ text, cocktails }),
    })
      .then((res) => res.json())
      .then((ids: number[]) => {
        setTextRecommendations(ids.map((cocktailId) => ({ cocktailId, predictedRating: 0 })))
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
    fetch(`${API_URL}/unavailable-ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient }),
    }).then(() => {
      setUnavailableIngredients((prev) => [...prev, ingredient])
    })
  }

  function handleMarkIngredientAvailable(ingredient: string) {
    fetch(`${API_URL}/unavailable-ingredients`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient }),
    }).then(() => {
      setUnavailableIngredients((prev) => prev.filter((i) => i !== ingredient))
    })
  }

  return (
    <div>
      <header className="app-header">
        <h1>🍸 Cocktail-Bestellungen</h1>
        <p className="app-subtitle">Shaken, not stirred</p>
      </header>

      {showReadyNotification && (
        <div className="notification">
          <p>
            <span className="pop-emoji">🍹</span> Deine Bestellung ist fertig!
          </p>
          <button type="button" className="btn" onClick={() => setShowReadyNotification(false)}>
            Schließen
          </button>
        </div>
      )}

      <nav className="tabs">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
        >
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
