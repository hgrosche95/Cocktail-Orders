import { useState, useEffect, useRef } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import BarkeeperLogin from './components/BarkeeperLogin'
import CustomerPage from './pages/CustomerPage'
import BarkeeperPage from './pages/BarkeeperPage'
import type { Cocktail } from './data/cocktails'
import type { OrderItem, SubmittedOrder } from './types'

const API_URL = `http://${window.location.hostname}:3001/api`

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

    const socket = new WebSocket(`ws://${window.location.hostname}:3002`)

    socket.addEventListener('message', () => {
      fetchOpenOrders()
      fetchUnavailableIngredients()
    })

    return () => socket.close()
  }, [])

  const [currentUser, setCurrentUser] = useState('')

  useEffect(() => {
    localStorage.setItem('order', JSON.stringify(order))
  }, [order])

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
    fetch(`${API_URL}/orders/${orderId}`, {
      method: 'DELETE',
    }).then(() => {
      setOpenOrders((prevOpenOrders) =>
        prevOpenOrders.filter((o) => o.orderId !== orderId)
      )
    })
  }

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
      <h1>Cocktail-Bestellungen</h1>

      {showReadyNotification && (
        <div className="notification">
          <p>🍹 Deine Bestellung ist fertig!</p>
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
