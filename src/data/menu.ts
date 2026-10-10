import { createContext, useContext } from 'react'
import baseCocktails from './cocktails'
import type { Cocktail } from './cocktails'

// Die ganze Karte: Grundkarte plus Drinks, die die Theke angelegt hat. App
// laedt sie vom Server (/api/menu) und stellt sie hier bereit. Bis dahin -
// und in Komponenten-Tests ohne Provider - gilt die Grundkarte aus
// shared/cocktails.json.
export const MenuContext = createContext<Cocktail[]>(baseCocktails)

export function useMenu(): Cocktail[] {
  return useContext(MenuContext)
}
