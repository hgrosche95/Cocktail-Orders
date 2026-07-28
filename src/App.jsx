import { useState, useEffect, useRef } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import CustomerPage from './pages/CustomerPage'
import BarkeeperPage from './pages/BarkeeperPage'

const API_URL = `http://${window.location.hostname}:3001/api`

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function App() {
  
  const [order, setOrder] = useState(() => {
    const saved = localStorage.getItem('order')
    return saved ? JSON.parse(saved) : []
  })


  const [openOrders, setOpenOrders] = useState([])

  useEffect(() => {
    function fetchOpenOrders() {
      fetch(`${API_URL}/orders`)
        .then((res) => res.json())
        .then((data) => setOpenOrders(data))
    }

    fetchOpenOrders()

    const socket = new WebSocket(`ws://${window.location.hostname}:3002`)

    socket.addEventListener('message', () => {
      fetchOpenOrders()
    })

    return () => socket.close()
  }, [])

  const [currentUser, setCurrentUser] = useState('')

  useEffect(() => {
    localStorage.setItem('order', JSON.stringify(order))
  }, [order])

  const orderFormRef = useRef(null)

  function handleAddToOrder(cocktail) {
    const orderItem = { ...cocktail, orderId: generateId() }
    setOrder([orderItem])
    orderFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleRemoveItem(orderId) {
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

  function handleSubmitOrder(note) {
    if (hasOpenOrder) return

    fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: currentUser, items: order, note }),
    })
      .then((res) => res.json())
      .then((newOrder) => {
        setOpenOrders((prevOpenOrders) => [...prevOpenOrders, newOrder])
        setOrder([])
      })
  }

  function handleMarkAsDone(orderId) {
    fetch(`${API_URL}/orders/${orderId}`, {
      method: 'DELETE',
    }).then(() => {
      setOpenOrders((prevOpenOrders) =>
        prevOpenOrders.filter((o) => o.orderId !== orderId)
      )
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
              />
            )
          }
        />
        <Route
          path="/barkeeper"
          element={<BarkeeperPage openOrders={openOrders} onMarkAsDone={handleMarkAsDone} />}
        />
      </Routes>
    </div>
  )
}

export default App