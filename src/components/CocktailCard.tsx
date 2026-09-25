import { Link } from 'react-router-dom'
import type { Cocktail } from '../data/cocktails'

interface CocktailCardProps {
  cocktail: Cocktail
  onAddToOrder: (cocktail: Cocktail) => void
}

// Zwei Ziele pro Karte: "+" merkt den Drink direkt vor, ein Klick auf den
// Rest der Karte oeffnet die Detailansicht mit Rezept und Bestellknopf.
function CocktailCard({ cocktail, onAddToOrder }: CocktailCardProps) {
  return (
    <li className="card cocktail-card">
      <Link
        to={`/drink/${cocktail.id}`}
        className="cocktail-card-body"
        aria-label={`${cocktail.name} ansehen`}
      >
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
        <p className="cocktail-movie">aus „{cocktail.movie}“</p>
      </Link>
      <button
        type="button"
        className="add-button"
        onClick={() => onAddToOrder(cocktail)}
        aria-label={`${cocktail.name} bestellen`}
      >
        +
      </button>
    </li>
  )
}

export default CocktailCard
