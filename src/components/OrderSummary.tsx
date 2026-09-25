import RecipeBar from './RecipeBar'
import type { OrderItem } from '../types'

interface OrderSummaryProps {
  order: OrderItem[]
  onRemoveItem: (orderId: string) => void
}

function OrderSummary({ order, onRemoveItem }: OrderSummaryProps) {
  return (
    <div className="card order-summary">
      <h2>Dein Drink</h2>
      {order.length === 0 ? (
        <p className="order-empty">Noch nichts bestellt.</p>
      ) : (
        <ul className="order-items">
          {order.map((item) => (
            <li key={item.orderId} className="order-item">
              <div className="order-item-head">
                <span className="order-item-name">{item.name}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => onRemoveItem(item.orderId)}
                >
                  Entfernen
                </button>
              </div>
              {item.recipe && <RecipeBar recipe={item.recipe} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default OrderSummary
