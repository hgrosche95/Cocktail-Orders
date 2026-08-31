import type { Cocktail } from '../data/cocktails'

interface CocktailCardProps {
  cocktail: Cocktail
  onAddToOrder: (cocktail: Cocktail) => void
}

function CocktailCard({ cocktail, onAddToOrder }: CocktailCardProps) {
  return (
    <li className="card cocktail-card">
      <h3>{cocktail.name}</h3>
      <ul className="cocktail-ingredient-list">
        {cocktail.ingredients.map((ingredient) => (
          <li key={ingredient} className="cocktail-ingredient-pill">
            {ingredient}
          </li>
        ))}
      </ul>
      {cocktail.description && (
        <p className="cocktail-description">{cocktail.description}</p>
      )}
      <p className="cocktail-movie">🎬 {cocktail.movie}</p>
      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => onAddToOrder(cocktail)}
      >
        Bestellen
      </button>
    </li>
  )
}

export default CocktailCard
