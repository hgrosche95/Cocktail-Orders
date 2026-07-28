import cocktails from '../data/cocktails'
import CocktailCard from './CocktailCard'

function CocktailList({ onAddToOrder }) {
  return (
    <ul className="cocktail-grid">
      {cocktails.map((cocktail) => (
        <CocktailCard key={cocktail.id} cocktail={cocktail} onAddToOrder={onAddToOrder} />
      ))}
    </ul>
  )
}

export default CocktailList