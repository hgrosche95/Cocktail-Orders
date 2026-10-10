import { readFileSync } from 'node:fs'

// Die Grundkarte, die auch das Frontend als Startwert mitbringt
// (shared/cocktails.json). Lokal liegt sie neben server/, im Docker-Image
// kopiert das Dockerfile sie nach /shared, beides ist von hier aus ../shared.
export const cocktails = JSON.parse(
  readFileSync(new URL('../shared/cocktails.json', import.meta.url), 'utf8')
)

export const categories = [...new Set(cocktails.map((cocktail) => cocktail.category))]

// IDs der Grundkarte liegen unter 1000; Drinks der Theke bekommen ihre IDs
// aus einer Sequenz ab 1001 (siehe Migration add_custom_cocktails), damit
// sich beide nie ueberschneiden.
export const FIRST_CUSTOM_ID = 1001

function toCocktail(row) {
  return {
    id: row.id,
    name: row.name,
    ...row.data,
    // Flache Zutatenliste wie in der Grundkarte: daran haengen Bestand
    // ("leer"), Filter und Wunsch-Feature.
    ingredients: row.data.recipe.ingredients.map((ingredient) => ingredient.name),
    custom: true,
  }
}

/**
 * Ganze Karte = Grundkarte + Drinks, die die Theke angelegt hat. Wird pro
 * App-Instanz einmal geladen und nach jeder Aenderung neu (invalidate).
 * Es laeuft genau eine Server-Instanz (siehe infra), ein gemeinsamer Cache
 * ueber Instanzen hinweg ist deshalb nicht noetig.
 */
export function createMenu(prisma) {
  let loading = null

  async function load() {
    const rows = await prisma.customCocktail.findMany({ orderBy: { id: 'asc' } })
    const list = [...cocktails, ...rows.map(toCocktail)]
    return { list, byId: new Map(list.map((cocktail) => [cocktail.id, cocktail])) }
  }

  function current() {
    if (!loading) {
      loading = load().catch((error) => {
        // Fehlschlag nicht zwischenspeichern, sonst bliebe die Karte bis
        // zum Neustart kaputt.
        loading = null
        throw error
      })
    }
    return loading
  }

  return {
    async all() {
      return (await current()).list
    },
    async finder() {
      const { byId } = await current()
      return (id) => byId.get(id)
    },
    invalidate() {
      loading = null
    },
  }
}
