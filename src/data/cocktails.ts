import menu from '../../shared/cocktails.json'

export interface RecipeIngredient {
  name: string
  amountCl?: number
  note?: string
}

export interface Recipe {
  ingredients: RecipeIngredient[]
  ice: string
  servedWithIceCubes: boolean
}

export interface Cocktail {
  id: number
  name: string
  category: string
  ingredients: string[]
  description?: string
  movie: string
  recipe: Recipe
}


// Die Karte liegt als JSON in shared/, damit Frontend und Server dieselbe
// Quelle lesen. Der Server braucht sie, um Bestellungen und Wunsch-Anfragen
// gegen die echte Karte zu prüfen, statt der Karte vom Client zu glauben.
const cocktails: Cocktail[] = menu

export default cocktails
