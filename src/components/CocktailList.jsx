import { useState } from 'react'
import cocktails from '../data/cocktails'
import CocktailCard from './CocktailCard'

function groupByCategory(items) {
  const groups = new Map()

  for (const item of items) {
    if (!groups.has(item.category)) {
      groups.set(item.category, [])
    }
    groups.get(item.category).push(item)
  }

  return groups
}

function CocktailList({ onAddToOrder, unavailableIngredients }) {
  const availableCocktails = cocktails.filter(
    (cocktail) =>
      !cocktail.ingredients.some((ingredient) =>
        unavailableIngredients.includes(ingredient)
      )
  )

  const categories = groupByCategory(availableCocktails)
  const categoryNames = Array.from(categories.keys())

  const [selectedCategory, setSelectedCategory] = useState('Alle')

  const visibleCategories =
    selectedCategory === 'Alle'
      ? categories
      : new Map([[selectedCategory, categories.get(selectedCategory)]])

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
