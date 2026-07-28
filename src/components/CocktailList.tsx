import { useState } from 'react'
import cocktails from '../data/cocktails'
import type { Cocktail } from '../data/cocktails'
import CocktailCard from './CocktailCard'

function groupByCategory(items: Cocktail[]): Map<string, Cocktail[]> {
  const groups = new Map<string, Cocktail[]>()

  for (const item of items) {
    const group = groups.get(item.category) ?? []
    group.push(item)
    groups.set(item.category, group)
  }

  return groups
}

interface CocktailListProps {
  onAddToOrder: (cocktail: Cocktail) => void
  unavailableIngredients: string[]
}

function CocktailList({ onAddToOrder, unavailableIngredients }: CocktailListProps) {
  const availableCocktails = cocktails.filter(
    (cocktail) =>
      !cocktail.ingredients.some((ingredient) =>
        unavailableIngredients.includes(ingredient)
      )
  )

  const categories = groupByCategory(availableCocktails)
  const categoryNames = Array.from(categories.keys())

  const [selectedCategory, setSelectedCategory] = useState('Alle')

  const visibleCategories: Map<string, Cocktail[]> =
    selectedCategory === 'Alle'
      ? categories
      : new Map([[selectedCategory, categories.get(selectedCategory) ?? []]])

  return (
    <div>
      <div className="category-filter">
        <button
          type="button"
          className={selectedCategory === 'Alle' ? 'filter-chip active' : 'filter-chip'}
          onClick={() => setSelectedCategory('Alle')}
        >
          Alle
        </button>
        {categoryNames.map((category) => (
          <button
            key={category}
            type="button"
            className={selectedCategory === category ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {Array.from(visibleCategories.entries()).map(([category, items]) => (
        <section key={category} className="cocktail-category">
          <h2>{category}</h2>
          <ul className="cocktail-grid">
            {items.map((cocktail) => (
              <CocktailCard key={cocktail.id} cocktail={cocktail} onAddToOrder={onAddToOrder} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default CocktailList
