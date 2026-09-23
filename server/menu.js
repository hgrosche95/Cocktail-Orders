import { readFileSync } from 'node:fs'

// Dieselbe Karte, die auch das Frontend anzeigt (shared/cocktails.json).
// Lokal liegt sie neben server/, im Docker-Image kopiert das Dockerfile sie
// nach /shared, beides ist von hier aus ../shared.
export const cocktails = JSON.parse(
  readFileSync(new URL('../shared/cocktails.json', import.meta.url), 'utf8')
)

const cocktailsById = new Map(cocktails.map((cocktail) => [cocktail.id, cocktail]))

export function findCocktail(id) {
  return cocktailsById.get(id)
}
