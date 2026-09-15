import cocktails from '../data/cocktails'
import type { Cocktail } from '../data/cocktails'
import CocktailCard from './CocktailCard'
import type { Recommendation } from '../types'

interface RecommendationsProps {
  recommendations: Recommendation[]
  unavailableIngredients: string[]
  onAddToOrder: (cocktail: Cocktail) => void
}

function Recommendations({
  recommendations,
  unavailableIngredients,
  onAddToOrder,
}: RecommendationsProps) {
  const recommendedCocktails = recommendations
    .map((rec) => cocktails.find((cocktail) => cocktail.id === rec.cocktailId))
    .filter((cocktail): cocktail is Cocktail => cocktail !== undefined)
    .filter(
      (cocktail) =>
        !cocktail.ingredients.some((ingredient) => unavailableIngredients.includes(ingredient))
    )

  if (recommendedCocktails.length === 0) return null

  return (
    <section className="cocktail-category recommendations">
      <h2>✨ Für dich empfohlen</h2>
      <ul className="cocktail-grid">
        {recommendedCocktails.map((cocktail) => (
          <CocktailCard key={cocktail.id} cocktail={cocktail} onAddToOrder={onAddToOrder} />
        ))}
      </ul>
    </section>
  )
}

export default Recommendations
