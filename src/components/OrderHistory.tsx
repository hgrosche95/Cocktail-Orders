import StarRating from './StarRating'
import type { OrderItem, SubmittedOrder } from '../types'

interface OrderHistoryProps {
  history: SubmittedOrder[]
  ratings: Record<number, number>
  onRate: (cocktailId: number, rating: number) => void
}

// Ein Gast kann denselben Cocktail mehrfach bestellt haben - fuer die Liste
// zaehlt nur der erste (juengste) Treffer, da history bereits absteigend
// nach completedAt sortiert vom Server kommt.
function uniqueCocktailsFromHistory(history: SubmittedOrder[]): OrderItem[] {
  const seen = new Set<number>()
  const result: OrderItem[] = []

  for (const order of history) {
    for (const item of order.items) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        result.push(item)
      }
    }
  }

  return result
}

function OrderHistory({ history, ratings, onRate }: OrderHistoryProps) {
  const cocktails = uniqueCocktailsFromHistory(history)

  return (
    <details className="card order-history">
      <summary>Meine bisherigen Cocktails</summary>
      {cocktails.length === 0 ? (
        <p>Noch keine abgeholten Cocktails.</p>
      ) : (
        <ul className="order-history-list">
          {cocktails.map((cocktail) => (
            <li key={cocktail.id} className="order-history-item">
              <span>{cocktail.name}</span>
              <StarRating
                value={ratings[cocktail.id] ?? 0}
                onRate={(rating) => onRate(cocktail.id, rating)}
              />
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}

export default OrderHistory
