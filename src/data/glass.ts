import type { Cocktail } from './cocktails'

export type GlassKind = 'coupe' | 'flute' | 'tumbler' | 'highball'

export interface GlassLayer {
  name: string
  share: number
}

function measuredIngredients(cocktail: Cocktail) {
  return (cocktail.recipe?.ingredients ?? []).filter((ingredient) => ingredient.amountCl != null)
}

// Klassiker, die die Regel unten falsch einordnet.
const GLASS_EXCEPTIONS: Record<string, GlassKind> = {
  Sazerac: 'tumbler',
  'Silver Fizz': 'highball',
}

// Die Rezeptdaten kennen kein Glas als eigenes Feld. Es laesst sich aber aus
// Eis, Menge und Filler ableiten - das gilt so auch fuer eigene Drinks der
// Theke, ohne dass jemand beim Anlegen ein Glas auswaehlen muss.
export function glassKind(cocktail: Cocktail): GlassKind {
  const exception = GLASS_EXCEPTIONS[cocktail.name]
  if (exception) return exception

  const measured = measuredIngredients(cocktail)
  const volume = measured.reduce((sum, ingredient) => sum + (ingredient.amountCl ?? 0), 0)
  const hasFiller = measured.some((ingredient) => /soda|tonic|sprudel|cola/i.test(ingredient.name))
  const hasIce = cocktail.recipe?.servedWithIceCubes ?? false

  if (hasIce) return volume >= 12 || hasFiller ? 'highball' : 'tumbler'
  if (measured.some((ingredient) => /sekt|champagner/i.test(ingredient.name))) return 'flute'
  return volume >= 12 ? 'highball' : 'coupe'
}

// Anteile der gemessenen Zutaten, von unten nach oben im Glas.
export function glassLayers(cocktail: Cocktail): GlassLayer[] {
  const measured = measuredIngredients(cocktail)
  const volume = measured.reduce((sum, ingredient) => sum + (ingredient.amountCl ?? 0), 0)
  if (volume === 0) return [{ name: cocktail.name, share: 1 }]

  return measured.map((ingredient) => ({
    name: ingredient.name,
    share: (ingredient.amountCl ?? 0) / volume,
  }))
}
