// Kennzahlen fuer die Theke: was wurde serviert, was kommt gut an, wieviel
// wurde von welcher Zutat verbraucht (fuer den Einkauf zur naechsten
// Party). Wie bei den Empfehlungen reicht bei dieser Datenmenge eine
// In-Memory-Berechnung pro Anfrage.

const TOP_LIMIT = 5

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/**
 * @param {object} input
 * @param {{ name: string, items: { id: number }[] }[]} input.servedOrders - abgeschlossene Bestellungen im Zeitraum
 * @param {{ cocktailId: number, rating: number }[]} input.ratings - Bewertungen im Zeitraum
 * @param {(id: number) => object | undefined} input.findCocktail - Karte (Rezepte kommen von dort, nicht aus der Bestellung)
 */
export function computeStats({ servedOrders, ratings, findCocktail }) {
  const guests = new Set()
  const countByCocktail = new Map()
  const ingredients = new Map()
  let servedDrinks = 0

  for (const order of servedOrders) {
    guests.add(order.name)

    for (const item of order.items) {
      const cocktail = findCocktail(item.id)
      // Inzwischen von der Karte genommen: zaehlt nicht mit, weil weder
      // Name noch Rezept bekannt sind.
      if (!cocktail) continue

      servedDrinks += 1
      countByCocktail.set(cocktail.id, (countByCocktail.get(cocktail.id) ?? 0) + 1)

      for (const { name, amountCl } of cocktail.recipe.ingredients) {
        const entry = ingredients.get(name) ?? { ingredient: name, totalCl: null, drinks: 0 }
        entry.drinks += 1
        // Zutaten ohne Menge (Minze, Bitter, Zimt) behalten totalCl = null:
        // die Theke sieht dann nur, in wie vielen Drinks sie steckten.
        if (typeof amountCl === 'number') entry.totalCl = (entry.totalCl ?? 0) + amountCl
        ingredients.set(name, entry)
      }
    }
  }

  const topCocktails = [...countByCocktail]
    .map(([cocktailId, count]) => ({ cocktailId, name: findCocktail(cocktailId).name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, TOP_LIMIT)

  const ratingsByCocktail = new Map()
  for (const { cocktailId, rating } of ratings) {
    if (!findCocktail(cocktailId)) continue
    const entry = ratingsByCocktail.get(cocktailId) ?? { sum: 0, count: 0 }
    entry.sum += rating
    entry.count += 1
    ratingsByCocktail.set(cocktailId, entry)
  }

  const topRated = [...ratingsByCocktail]
    .map(([cocktailId, { sum, count }]) => ({
      cocktailId,
      name: findCocktail(cocktailId).name,
      averageRating: round(sum / count, 1),
      ratingCount: count,
    }))
    .sort(
      (a, b) =>
        b.averageRating - a.averageRating ||
        b.ratingCount - a.ratingCount ||
        a.name.localeCompare(b.name)
    )
    .slice(0, TOP_LIMIT)

  const ratingTotal = [...ratingsByCocktail.values()].reduce((sum, entry) => sum + entry.sum, 0)
  const ratingCount = [...ratingsByCocktail.values()].reduce((sum, entry) => sum + entry.count, 0)

  const ingredientUsage = [...ingredients.values()]
    .map((entry) => ({
      ...entry,
      totalCl: entry.totalCl === null ? null : round(entry.totalCl, 1),
    }))
    .sort(
      (a, b) =>
        (b.totalCl ?? -1) - (a.totalCl ?? -1) ||
        b.drinks - a.drinks ||
        a.ingredient.localeCompare(b.ingredient)
    )

  return {
    servedDrinks,
    guests: guests.size,
    averageRating: ratingCount === 0 ? null : round(ratingTotal / ratingCount, 1),
    ratingCount,
    topCocktails,
    topRated,
    ingredientUsage,
  }
}
