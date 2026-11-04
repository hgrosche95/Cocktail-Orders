import { useEffect, useRef, useState } from 'react'
import CocktailList from '../components/CocktailList'
import OrderBar from '../components/OrderBar'
import RatingPrompt from '../components/RatingPrompt'
import OrderHistory from '../components/OrderHistory'
import Recommendations from '../components/Recommendations'
import WishInput from '../components/WishInput'
import HelpGuide from '../components/HelpGuide'
import WaitingPanel from '../components/WaitingPanel'
import type { Cocktail } from '../data/cocktails'
import type { OrderItem, SubmittedOrder, Recommendation } from '../types'

interface CustomerPageProps {
  order: OrderItem[]
  onAddToOrder: (cocktail: Cocktail) => void
  onRemoveItem: (orderId: string) => void
  onSubmitOrder: (note: string) => void
  onCancelOrder: (orderId: string) => void
  hasOpenOrder: boolean
  ownOpenOrder: SubmittedOrder | null
  queuePosition: number
  queueLength: number
  unavailableIngredients: string[]
  history: SubmittedOrder[]
  ratings: Record<number, number>
  recommendations: Recommendation[]
  pendingRatingItem: { orderId: string; item: OrderItem } | null
  onRateCocktail: (cocktailId: number, rating: number) => void
  onDismissRatingPrompt: (orderId: string) => void
  textRecommendations: Recommendation[]
  isTextRecommending: boolean
  onWishSubmit: (text: string) => void
  wishNote: string
  isWishFeatureDisabled: boolean
}

function CustomerPage({
  order,
  onAddToOrder,
  onRemoveItem,
  onSubmitOrder,
  onCancelOrder,
  hasOpenOrder,
  ownOpenOrder,
  queuePosition,
  queueLength,
  unavailableIngredients,
  history,
  ratings,
  recommendations,
  pendingRatingItem,
  onRateCocktail,
  onDismissRatingPrompt,
  textRecommendations,
  isTextRecommending,
  onWishSubmit,
  wishNote,
  isWishFeatureDisabled,
}: CustomerPageProps) {
  const waitingPanelRef = useRef<HTMLDivElement>(null)
  const [isWaitingPanelVisible, setIsWaitingPanelVisible] = useState(false)

  // Die Leiste unten zeigt den Platz in der Schlange nur, solange die grosse
  // Warteansicht aus dem Bild gescrollt ist. Pruefung auf den Typ, weil jsdom
  // in den Tests keinen IntersectionObserver kennt.
  useEffect(() => {
    const panel = waitingPanelRef.current
    if (!panel || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setIsWaitingPanelVisible(entry.isIntersecting),
      { threshold: 0.25 }
    )
    observer.observe(panel)
    return () => observer.disconnect()
  }, [hasOpenOrder])

  return (
    <>
      <div className="queue-row">
        <p className="queue-counter">
          <span className="live-dot" aria-hidden="true" />
          {queueLength} {queueLength === 1 ? 'Bestellung' : 'Bestellungen'} in der Warteschlange
        </p>
        <HelpGuide />
      </div>

      {ownOpenOrder && (
        <div ref={waitingPanelRef}>
          <WaitingPanel
            order={ownOpenOrder}
            position={queuePosition}
            queueLength={queueLength}
            onCancel={() => onCancelOrder(ownOpenOrder.orderId)}
          />
        </div>
      )}

      {pendingRatingItem && (
        <RatingPrompt
          cocktailName={pendingRatingItem.item.name}
          onRate={(rating) => onRateCocktail(pendingRatingItem.item.id, rating)}
          onDismiss={() => onDismissRatingPrompt(pendingRatingItem.orderId)}
        />
      )}

      <Recommendations
        recommendations={recommendations}
        unavailableIngredients={unavailableIngredients}
        onAddToOrder={onAddToOrder}
      />

      <WishInput
        onSubmit={onWishSubmit}
        isLoading={isTextRecommending}
        isDisabled={isWishFeatureDisabled}
      />
      <Recommendations
        recommendations={textRecommendations}
        unavailableIngredients={unavailableIngredients}
        onAddToOrder={onAddToOrder}
        title="Passend zu deinem Wunsch"
      />

      <CocktailList
        onAddToOrder={onAddToOrder}
        unavailableIngredients={unavailableIngredients}
      />

      <OrderHistory history={history} ratings={ratings} onRate={onRateCocktail} />

      <OrderBar
        order={order}
        onSubmitOrder={onSubmitOrder}
        onRemoveItem={onRemoveItem}
        initialNote={wishNote}
        ownOpenOrder={ownOpenOrder}
        queuePosition={queuePosition}
        queueLength={queueLength}
        isWaitingPanelVisible={isWaitingPanelVisible}
        onShowWaitingPanel={() =>
          waitingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      />
    </>
  )
}

export default CustomerPage
