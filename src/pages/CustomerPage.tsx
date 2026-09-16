import type { RefObject } from 'react'
import CocktailList from '../components/CocktailList'
import OrderSummary from '../components/OrderSummary'
import OrderForm from '../components/OrderForm'
import RatingPrompt from '../components/RatingPrompt'
import OrderHistory from '../components/OrderHistory'
import Recommendations from '../components/Recommendations'
import WishInput from '../components/WishInput'
import type { Cocktail } from '../data/cocktails'
import type { OrderItem, SubmittedOrder, Recommendation } from '../types'

interface CustomerPageProps {
  order: OrderItem[]
  onAddToOrder: (cocktail: Cocktail) => void
  onRemoveItem: (orderId: string) => void
  onSubmitOrder: (note: string) => void
  hasOpenOrder: boolean
  orderFormRef: RefObject<HTMLDivElement | null>
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
}

function CustomerPage({
  order,
  onAddToOrder,
  onRemoveItem,
  onSubmitOrder,
  hasOpenOrder,
  orderFormRef,
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
}: CustomerPageProps) {
  return (
    <>
      <p className="queue-counter">
        🍹 {queueLength} {queueLength === 1 ? 'Bestellung' : 'Bestellungen'} in der Warteschlange
      </p>

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

      <WishInput onSubmit={onWishSubmit} isLoading={isTextRecommending} />
      <Recommendations
        recommendations={textRecommendations}
        unavailableIngredients={unavailableIngredients}
        onAddToOrder={onAddToOrder}
        title="🔮 Passend zu deinem Wunsch"
      />

      <CocktailList
        onAddToOrder={onAddToOrder}
        unavailableIngredients={unavailableIngredients}
      />
      <OrderSummary order={order} onRemoveItem={onRemoveItem} />
      <div ref={orderFormRef}>
        <OrderForm order={order} onSubmitOrder={onSubmitOrder} hasOpenOrder={hasOpenOrder} />
      </div>

      <OrderHistory history={history} ratings={ratings} onRate={onRateCocktail} />
    </>
  )
}

export default CustomerPage
