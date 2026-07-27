function CocktailCard({ cocktail, onAddToOrder }) {
  return (
    <li className="card cocktail-card">
      <h3>{cocktail.name}</h3>
      <p className="cocktail-description">{cocktail.description}</p>
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