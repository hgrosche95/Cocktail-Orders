import { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, NavLink, Link, useMatch } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import BarkeeperLogin from './components/BarkeeperLogin'
import CustomerPage from './pages/CustomerPage'
import BarkeeperPage from './pages/BarkeeperPage'
import Skyline from './components/Skyline'
import DrinkPage from './pages/DrinkPage'
import StatsPage from './pages/StatsPage'
import type { Stats } from './pages/StatsPage'
import cocktails from './data/cocktails'
import { connectLiveUpdates } from './liveUpdates'
import { WS_URL, getJson, sendJson } from './api'
import { useGuestData } from './hooks/useGuestData'
import { useBarkeeperAuth } from './hooks/useBarkeeperAuth'
import { useWish } from './hooks/useWish'
import type { Cocktail } from './data/cocktails'
import type { OrderItem, SubmittedOrder } from './types'

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
  const [dismissedHistoryOrderId, setDismissedHistoryOrderId] = useState<string | null>(null)
  // Zaehlt jede Live-Aenderung mit; Ansichten, die selbst laden (Statistik),
  // laden darauf neu.
  const [liveVersion, setLiveVersion] = useState(0)

  const [currentUser, setCurrentUser] = useState(
    () => localStorage.getItem('currentUser') ?? ''
  )
  const currentUserRef = useRef(currentUser)

  // Ist der Server nicht erreichbar (kein Netz, Container wacht gerade auf),
  // zeigt die Seite einen Hinweis, statt unbehandelte Fehler in die Konsole
  // zu werfen.
  const [isServerUnreachable, setIsServerUnreachable] = useState(false)
  const reportUnreachable = useCallback(() => setIsServerUnreachable(true), [])

  const { history, ratings, recommendations, refreshGuestData, rateCocktail } = useGuestData(
    currentUser,
    reportUnreachable
  )
  const { isBarkeeperAuthenticated, login: handleBarkeeperLogin, barkeeperFetch } =
    useBarkeeperAuth()

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  useEffect(() => {
    function fetchOpenOrders() {
      getJson<SubmittedOrder[]>('/orders')
        .then((data) => {
          setOpenOrders(data)
          setIsServerUnreachable(false)
        })
        .catch(reportUnreachable)
    }

    function fetchUnavailableIngredients() {
      getJson<string[]>('/unavailable-ingredients')
        .then(setUnavailableIngredients)
        .catch(reportUnreachable)
    }

    function refreshAll() {
      setLiveVersion((version) => version + 1)
      fetchOpenOrders()
      fetchUnavailableIngredients()

      // Betrifft z.B. den Fall, dass der Barkeeper gerade diese Bestellung
      // fertig markiert hat - die Historie muss das mitbekommen, damit der
      // Bewertungs-Prompt fuer den neu abgeholten Cocktail erscheint.
      if (currentUserRef.current) {
        refreshGuestData(currentUserRef.current)
      }
    }

    fetchOpenOrders()
    fetchUnavailableIngredients()

    return connectLiveUpdates(WS_URL, { onChange: refreshAll, onReconnect: refreshAll })
  }, [refreshGuestData, reportUnreachable])

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

  const { textRecommendations, isTextRecommending, wishNote, isWishFeatureDisabled, submitWish } =
    useWish({ unavailableIngredients, onSingleMatch: handleAddToOrder })

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

  // "Fertig" heisst: die eigene offene Bestellung ist verschwunden UND steht
  // jetzt in der Historie. Nur aufs Verschwinden zu schauen, wuerde auch
  // nach einem Storno "fertig" melden. Beides kommt nach einer Aenderung in
  // beliebiger Reihenfolge an, deshalb ein Effekt fuer beide.
  const [showReadyNotification, setShowReadyNotification] = useState(false)
  const ownOpenOrderId = ownOpenOrder?.orderId ?? null
  const previousOwnOrderId = useRef<string | null>(null)
  const awaitingReadyOrderId = useRef<string | null>(null)

  useEffect(() => {
    const previousId = previousOwnOrderId.current
    previousOwnOrderId.current = ownOpenOrderId
    if (previousId && previousId !== ownOpenOrderId) {
      awaitingReadyOrderId.current = previousId
    }

    const awaitedId = awaitingReadyOrderId.current
    if (awaitedId && history.some((o) => o.orderId === awaitedId)) {
      awaitingReadyOrderId.current = null
      setShowReadyNotification(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [ownOpenOrderId, history])

  // items ist optional: die Karte schickt die vorgemerkte Bestellung ab, die
  // Detailansicht eines Drinks bestellt ihn direkt, ohne Umweg ueber `order`
  // (ein setOrder direkt vor dem fetch waere hier noch nicht angekommen).
  function handleSubmitOrder(note: string, items: OrderItem[] = order) {
    if (hasOpenOrder) return

    sendJson('/orders', 'POST', { name: currentUser, items, note })
      // 409 = Server kennt schon eine offene Bestellung dieses Gasts (z.B. aus
      // einem zweiten Tab), dann nichts in die lokale Liste uebernehmen.
      .then((res) => (res.ok ? res.json() : null))
      .then((newOrder: SubmittedOrder | null) => {
        if (!newOrder) return
        setOpenOrders((prevOpenOrders) => [...prevOpenOrders, newOrder])
        setOrder([])
      })
      .catch(reportUnreachable)
  }

  function handleCancelOrder(orderId: string) {
    sendJson(`/orders/${orderId}`, 'DELETE', { name: currentUser }).then((res) => {
      // 404: inzwischen fertig oder schon storniert - dann kommt der echte
      // Stand ohnehin ueber die Live-Updates.
      if (!res.ok) return
      setOpenOrders((prevOpenOrders) => prevOpenOrders.filter((o) => o.orderId !== orderId))
    }, reportUnreachable)
  }

  function handleMarkAsDone(orderId: string) {
    barkeeperFetch(`/orders/${orderId}/complete`, {
      method: 'PATCH',
    }).then((res) => {
      if (!res.ok) return
      setOpenOrders((prevOpenOrders) =>
        prevOpenOrders.filter((o) => o.orderId !== orderId)
      )
    }, reportUnreachable)
  }

  const loadStats = useCallback(
    (since: string | null): Promise<Stats | null> => {
      const query = since ? `?since=${encodeURIComponent(since)}` : ''
      return barkeeperFetch(`/stats${query}`).then((res) => (res.ok ? res.json() : null))
    },
    [barkeeperFetch]
  )

  function handleDismissRatingPrompt(orderId: string) {
    setDismissedHistoryOrderId(orderId)
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
    }, reportUnreachable)
  }

  function handleMarkIngredientAvailable(ingredient: string) {
    barkeeperFetch(`/unavailable-ingredients`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient }),
    }).then((res) => {
      if (!res.ok) return
      setUnavailableIngredients((prev) => prev.filter((i) => i !== ingredient))
    }, reportUnreachable)
  }

  const drinkMatch = useMatch('/drink/:id')
  const detailCocktail = drinkMatch
    ? cocktails.find((cocktail) => String(cocktail.id) === drinkMatch.params.id)
    : undefined
  const barkeeperMatch = useMatch('/barkeeper/*')
  const isArrival = currentUser === '' && !barkeeperMatch
  // Drink-Detail soll auf einen Handy-Screen passen: der Name liegt direkt
  // auf der Skyline, und die Tabs entfallen (zurueck geht es ueber "← Karte").
  const isDrinkDetail = !isArrival && detailCocktail !== undefined

  let headerClassName = 'app-header'
  if (isArrival) headerClassName += ' app-header-arrival'
  if (isDrinkDetail) headerClassName += ' app-header-detail'

  return (
    <div>
      {/* Der Header ist die Buehne ueber der Skyline und wechselt mit der
          Ansicht: Ankunft (noch nicht angemeldet), Drink-Detail oder die
          normale Marke. */}
      <header className={headerClassName}>
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

      {isServerUnreachable && (
        <div className="notification">
          <p>Die Bar ist gerade nicht erreichbar. Versuch es gleich noch einmal.</p>
          <button type="button" className="btn" onClick={() => setIsServerUnreachable(false)}>
            Schließen
          </button>
        </div>
      )}

      {!isDrinkDetail && (
        <nav className="tabs">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Kunde
          </NavLink>
          <NavLink
            to="/barkeeper"
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          >
            Barkeeper
          </NavLink>
        </nav>
      )}

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
                onCancelOrder={handleCancelOrder}
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
                onRateCocktail={rateCocktail}
                onDismissRatingPrompt={handleDismissRatingPrompt}
                textRecommendations={textRecommendations}
                isTextRecommending={isTextRecommending}
                onWishSubmit={submitWish}
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
          path="/barkeeper/statistik"
          element={
            isBarkeeperAuthenticated ? (
              <StatsPage loadStats={loadStats} liveVersion={liveVersion} />
            ) : (
              <BarkeeperLogin onLogin={handleBarkeeperLogin} />
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
