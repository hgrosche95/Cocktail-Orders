// Prueft einen neuen Drink aus dem Barkeeper-Formular. Die Theke ist zwar
// angemeldet, aber Name, Beschreibung und Zutaten landen spaeter im
// System-Prompt fuers Wunsch-Feature und bei allen Gaesten auf der Karte:
// deshalb feste Laengen, keine Zeilenumbrueche, nur bekannte Kategorien.

const LIMITS = {
  name: 60,
  movie: 80,
  description: 300,
  ingredientName: 40,
  note: 80,
  ice: 150,
  ingredients: 12,
  amountCl: 50,
}

function cleanText(value, max, field, { required = false } = {}) {
  if (value === undefined || value === null) value = ''
  if (typeof value !== 'string') throw new Error(`${field} must be a string`)
  const text = value.replace(/\s+/g, ' ').trim()
  if (required && !text) throw new Error(`${field} is required`)
  if (text.length > max) throw new Error(`${field} must be at most ${max} characters`)
  return text
}

/**
 * @returns {{ value: { name: string, data: object } } | { error: string }}
 */
export function parseCocktailInput(body, { categories }) {
  try {
    const input = body ?? {}
    const name = cleanText(input.name, LIMITS.name, 'name', { required: true })
    const category = cleanText(input.category, 100, 'category', { required: true })
    if (!categories.includes(category)) throw new Error('unknown category')
    const movie = cleanText(input.movie, LIMITS.movie, 'movie')
    const description = cleanText(input.description, LIMITS.description, 'description')

    const recipe = input.recipe ?? {}
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      throw new Error('recipe.ingredients must not be empty')
    }
    if (recipe.ingredients.length > LIMITS.ingredients) {
      throw new Error(`at most ${LIMITS.ingredients} ingredients`)
    }

    const seen = new Set()
    const ingredients = recipe.ingredients.map((raw) => {
      const ingredient = raw ?? {}
      const ingredientName = cleanText(ingredient.name, LIMITS.ingredientName, 'ingredient name', {
        required: true,
      })
      const key = ingredientName.toLocaleLowerCase('de')
      if (seen.has(key)) throw new Error(`duplicate ingredient ${ingredientName}`)
      seen.add(key)

      const entry = { name: ingredientName }
      if (ingredient.amountCl !== undefined && ingredient.amountCl !== null && ingredient.amountCl !== '') {
        const amount = ingredient.amountCl
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > LIMITS.amountCl) {
          throw new Error(`amountCl must be a number between 0 and ${LIMITS.amountCl}`)
        }
        entry.amountCl = Math.round(amount * 10) / 10
      }
      const note = cleanText(ingredient.note, LIMITS.note, 'ingredient note')
      if (note) entry.note = note
      return entry
    })

    const ice = cleanText(recipe.ice, LIMITS.ice, 'recipe.ice')
    const servedWithIceCubes = recipe.servedWithIceCubes === true

    const data = {
      category,
      movie,
      recipe: { ingredients, ice, servedWithIceCubes },
    }
    if (description) data.description = description

    return { value: { name, data } }
  } catch (error) {
    return { error: error.message }
  }
}
