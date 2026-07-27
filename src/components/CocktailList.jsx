import cocktails from '../data/cocktails'
import CocktailCard from './CocktailCard'

function CocktailList({ onAddToOrder }) {
  return (
    <ul>
      {cocktails.map((cocktail) => (
        <CocktailCard key={cocktail.id} cocktail={cocktail} onAddToOrder={onAddToOrder} />
      ))}
    </ul>
  )
}

export default CocktailList