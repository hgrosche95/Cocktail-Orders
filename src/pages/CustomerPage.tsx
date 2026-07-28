import type { RefObject } from 'react'
import CocktailList from '../components/CocktailList'
import OrderSummary from '../components/OrderSummary'
import OrderForm from '../components/OrderForm'
import type { Cocktail } from '../data/cocktails'
import type { OrderItem } from '../types'

interface CustomerPageProps {
  order: OrderItem[]
  onAddToOrder: (cocktail: Cocktail) => void
  onRemoveItem: (orderId: string) => void
  onSubmitOrder: (note: string) => void
  hasOpenOrder: boolean
  orderFormRef: RefObject<HTMLDivElement | null>
  queueLength: number
  unavailableIngredients: string[]
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
}: CustomerPageProps) {
  return (
    <>
      <p className="queue-counter">
        🍹 {queueLength} {queueLength === 1 ? 'Bestellung' : 'Bestellungen'} in der Warteschlange
      </p>
      <CocktailList
        onAddToOrder={onAddToOrder}
        unavailableIngredients={unavailableIngredients}
      />
      <OrderSummary order={order} onRemoveItem={onRemoveItem} />
      <div ref={orderFormRef}>
        <OrderForm order={order} onSubmitOrder={onSubmitOrder} hasOpenOrder={hasOpenOrder} />
      </div>
    </>
  )
}

export default CustomerPage
