import type { Recipe } from '../data/cocktails'

// Feste Farbfolge statt einer Farbe pro Zutat: bei ueber 40 Zutaten waere
// eine Zuordnung kaum pflegbar, und im Balken zaehlt nur, dass benachbarte
// Segmente sich unterscheiden.
const SEGMENT_COLORS = ['#ff7a45', '#ffd89a', '#a9c7df', '#c4e04a', '#ff86b0', '#d9c6ad']

function formatCl(amount: number): string {
  return `${String(amount).replace('.', ',')} cl`
}

interface RecipeBarProps {
  recipe: Recipe
}

// Zeigt die Rezeptmengen als Balken: jede Zutat mit cl-Angabe bekommt ein
// Segment proportional zu ihrer Menge. Zutaten ohne Menge (Dashes, Garnitur)
// stehen darunter als "dazu".
function RecipeBar({ recipe }: RecipeBarProps) {
  const measured = recipe.ingredients.filter((ingredient) => ingredient.amountCl != null)
  const extras = recipe.ingredients.filter((ingredient) => ingredient.amountCl == null)

  if (measured.length === 0) return null

  return (
    <div className="recipe-bar">
      <div className="recipe-bar-track" aria-hidden="true">
        {measured.map((ingredient, index) => (
          <span
            key={ingredient.name}
            style={{
              flexGrow: ingredient.amountCl,
              background: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
            }}
          />
        ))}
      </div>
      <ul className="recipe-bar-legend">
        {measured.map((ingredient, index) => (
          <li key={ingredient.name}>
            <span
              className="recipe-bar-swatch"
              style={{ background: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
              aria-hidden="true"
            />
            {ingredient.name} <span className="amount">{formatCl(ingredient.amountCl!)}</span>
          </li>
        ))}
      </ul>
      {extras.length > 0 && (
        <p className="recipe-bar-extras">dazu: {extras.map((ingredient) => ingredient.name).join(', ')}</p>
      )}
    </div>
  )
}

export default RecipeBar
