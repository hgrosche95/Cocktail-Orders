function CocktailCard({ cocktail, onAddToOrder }) {
  return (
    <li className="card cocktail-card">
      <h3>{cocktail.name}</h3>
      <p className="cocktail-ingredients">{cocktail.ingredients.join(' · ')}</p>
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