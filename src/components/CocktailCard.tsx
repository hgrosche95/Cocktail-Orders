import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import DrinkGlass from './DrinkGlass'
import { getCategoryTheme } from '../data/categories'
import type { Cocktail } from '../data/cocktails'

interface CocktailCardProps {
  cocktail: Cocktail
  onAddToOrder: (cocktail: Cocktail) => void
}

// Zwei Ziele pro Karte: "+" merkt den Drink in der Leiste unten vor, ein Klick
// auf den Rest der Karte oeffnet die Detailansicht mit Rezept und Bestellknopf.
function CocktailCard({ cocktail, onAddToOrder }: CocktailCardProps) {
  return (
    <li
      className="card cocktail-card"
      style={{ '--cat-color': getCategoryTheme(cocktail.category).color } as CSSProperties}
    >
      <Link
        to={`/drink/${cocktail.id}`}
        className="cocktail-card-body"
        aria-label={`${cocktail.name} ansehen`}
      >
        <DrinkGlass cocktail={cocktail} />
        <div className="cocktail-card-text">
          <h3>{cocktail.name}</h3>
          <ul className="cocktail-ingredient-list">
            {cocktail.ingredients.map((ingredient) => (
              <li key={ingredient} className="cocktail-ingredient">
                {ingredient}
              </li>
            ))}
          </ul>
          {cocktail.description && (
            <p className="cocktail-description">{cocktail.description}</p>
          )}
        </div>
      </Link>
      <button
        type="button"
        className="add-button"
        onClick={() => onAddToOrder(cocktail)}
        aria-label={`${cocktail.name} vormerken`}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M8 2.5v11M2.5 8h11" />
        </svg>
      </button>
    </li>
  )
}

export default CocktailCard
