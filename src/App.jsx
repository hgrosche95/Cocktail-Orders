import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
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

  function handleAddToOrder(cocktail) {
    const orderItem = { ...cocktail, orderId: generateId() }
    setOrder([orderItem])
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
        <div>
          <p>🍹 Deine Bestellung ist fertig!</p>
          <button type="button" onClick={() => setShowReadyNotification(false)}>
            Schließen
          </button>
        </div>
      )}

      <nav>
        <Link to="/">Kunde</Link>
        {' | '}
        <Link to="/barkeeper">Barkeeper</Link>
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