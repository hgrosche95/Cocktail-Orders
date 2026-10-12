import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useMenu } from '../data/menu'
import type { Cocktail } from '../data/cocktails'
import { getCategoryTheme } from '../data/categories'
import type { SubmittedOrder } from '../types'

function categoryStyle(color: string): CSSProperties {
  return { '--cat-color': color } as CSSProperties
}

function getAllIngredients(cocktails: Cocktail[]): string[] {
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
  onStartOrder: (orderId: string) => void
  isSoundOn: boolean
  onToggleSound: () => void
  unavailableIngredients: string[]
  onMarkIngredientUnavailable: (ingredient: string) => void
  onMarkIngredientAvailable: (ingredient: string) => void
}

function BarkeeperPage({
  openOrders,
  onMarkAsDone,
  onStartOrder,
  isSoundOn,
  onToggleSound,
  unavailableIngredients,
  onMarkIngredientUnavailable,
  onMarkIngredientAvailable,
}: BarkeeperPageProps) {
  const cocktails = useMenu()
  const allIngredients = getAllIngredients(cocktails)

  return (
    <div>
      <div className="bar-header">
        <h2>
          Theke <span className="category-count">{openOrders.length} offen</span>
        </h2>
        <div className="bar-header-links">
          <button
            type="button"
            className="btn btn-ghost btn-small"
            aria-pressed={isSoundOn}
            title={isSoundOn ? 'Ton bei neuen Bestellungen ausschalten' : 'Ton bei neuen Bestellungen einschalten'}
            onClick={onToggleSound}
          >
            {isSoundOn ? '🔔 Ton an' : '🔕 Ton aus'}
          </button>
          <Link to="/barkeeper/karte" className="btn btn-ghost btn-small">
            Karte
          </Link>
          <Link to="/barkeeper/statistik" className="btn btn-ghost btn-small">
            Statistik
          </Link>
        </div>
      </div>
      {openOrders.length === 0 ? (
        <p className="order-empty">Keine offenen Bestellungen.</p>
      ) : (
        <ul className="order-list">
          {openOrders.map((submittedOrder) => (
            <li
              key={submittedOrder.orderId}
              className={submittedOrder.startedAt ? 'card barkeeper-order started' : 'card barkeeper-order'}
            >
              <h3>
                {submittedOrder.name}
                {submittedOrder.startedAt && <span className="order-status">In Arbeit</span>}
              </h3>
              <ul className="recipe-list">
                {submittedOrder.items.map((item) => {
                  const theme = getCategoryTheme(item.category)
                  return (
                  <li key={item.orderId} className="recipe-item" style={categoryStyle(theme.color)}>
                    <strong className="recipe-name">{item.name}</strong>
                    <ul className="recipe-ingredients">
                      {item.recipe.ingredients.map((ingredient, index) => (
                        <li key={index}>
                          <span className="amount">
                            {ingredient.amountCl != null ? `${ingredient.amountCl} cl` : ''}
                          </span>
                          <span>
                            {ingredient.name}
                            {ingredient.note && ` (${ingredient.note})`}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="recipe-meta">
                      {item.recipe.ice} ·{' '}
                      {item.recipe.servedWithIceCubes
                        ? 'mit Eiswürfeln im Glas servieren'
                        : 'ohne Eiswürfel im Glas servieren'}
                    </p>
                  </li>
                  )
                })}
              </ul>
              {submittedOrder.note && <p className="note">„{submittedOrder.note}“</p>}
              <div className="order-actions">
                {!submittedOrder.startedAt && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => onStartOrder(submittedOrder.orderId)}
                  >
                    Anfangen
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => onMarkAsDone(submittedOrder.orderId)}
                >
                  Erledigt
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2>Bestand</h2>
      <p className="section-hint">Antippen, was leer ist – nochmal antippen, wenn es wieder da ist.</p>
      <ul className="ingredient-list">
        {allIngredients.map((ingredient) => {
          const isUnavailable = unavailableIngredients.includes(ingredient)

          return (
            <li key={ingredient}>
              <button
                type="button"
                className={isUnavailable ? 'ingredient-chip unavailable' : 'ingredient-chip'}
                aria-pressed={isUnavailable}
                title={isUnavailable ? 'Wieder verfügbar' : 'Als leer markieren'}
                onClick={() =>
                  isUnavailable
                    ? onMarkIngredientAvailable(ingredient)
                    : onMarkIngredientUnavailable(ingredient)
                }
              >
                {ingredient}
                {isUnavailable && <span className="ingredient-chip-tag">leer</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default BarkeeperPage
