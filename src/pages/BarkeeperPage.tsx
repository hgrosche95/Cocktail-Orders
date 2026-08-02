import cocktails from '../data/cocktails'
import type { SubmittedOrder } from '../types'

function getAllIngredients(): string[] {
  const ingredients = new Set<string>()

  for (const cocktail of cocktails) {
    for (const ingredient of cocktail.ingredients) {
      ingredients.add(ingredient)
    }
  }

  return Array.from(ingredients).sort()
}

interface BarkeeperPageProps {
  openOrders: SubmittedOrder[]
  onMarkAsDone: (orderId: string) => void
  unavailableIngredients: string[]
  onMarkIngredientUnavailable: (ingredient: string) => void
  onMarkIngredientAvailable: (ingredient: string) => void
}

function BarkeeperPage({
  openOrders,
  onMarkAsDone,
  unavailableIngredients,
  onMarkIngredientUnavailable,
  onMarkIngredientAvailable,
}: BarkeeperPageProps) {
  const allIngredients = getAllIngredients()

  return (
    <div>
      <h2>Offene Bestellungen</h2>
      {openOrders.length === 0 ? (
        <p>Keine offenen Bestellungen.</p>
      ) : (
        <ul className="order-list">
          {openOrders.map((submittedOrder) => (
            <li key={submittedOrder.orderId} className="card barkeeper-order">
              <h3>{submittedOrder.name}</h3>
              <ul className="recipe-list">
                {submittedOrder.items.map((item) => (
                  <li key={item.orderId} className="recipe-item">
                    <strong>{item.name}</strong>
                    <ul className="recipe-ingredients">
                      {item.recipe.ingredients.map((ingredient, index) => (
                        <li key={index}>
                          {ingredient.amountCl != null
                            ? `${ingredient.amountCl} cl ${ingredient.name}`
                            : ingredient.name}
                          {ingredient.note && ` (${ingredient.note})`}
                        </li>
                      ))}
                    </ul>
                    <p className="recipe-meta">🧊 {item.recipe.ice}</p>
                    <p className="recipe-meta">
                      {item.recipe.servedWithIceCubes
                        ? 'Mit Eiswürfeln im Glas servieren'
                        : 'Ohne Eiswürfel im Glas servieren'}
                    </p>
                  </li>
                ))}
              </ul>
              {submittedOrder.note && <p className="note">Anmerkung: {submittedOrder.note}</p>}
              <button
                type="button"
                className="btn btn-success btn-block"
                onClick={() => onMarkAsDone(submittedOrder.orderId)}
              >
                Erledigt
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Zutaten</h2>
      <ul className="ingredient-list">
        {allIngredients.map((ingredient) => {
          const isUnavailable = unavailableIngredients.includes(ingredient)

          return (
            <li
              key={ingredient}
              className={isUnavailable ? 'ingredient-item unavailable' : 'ingredient-item'}
            >
              <span>{ingredient}</span>
              {isUnavailable ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => onMarkIngredientAvailable(ingredient)}
                >
                  Wieder verfügbar
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => onMarkIngredientUnavailable(ingredient)}
                >
                  Als leer markieren
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default BarkeeperPage
