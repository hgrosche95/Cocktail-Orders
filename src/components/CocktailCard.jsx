function CocktailCard({ cocktail, onAddToOrder }) {
  return (
    <li>
      <strong>{cocktail.name}</strong>
      <p>{cocktail.description}</p>
      <button type="button" onClick={() => onAddToOrder(cocktail)}>
        Bestellen
      </button>
    </li>
  )
}

export default CocktailCard