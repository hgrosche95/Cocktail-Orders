export interface CategoryTheme {
  color: string
}

// Ein Farbton pro Kategorie: fuellt das Glas auf der Karte und faerbt
// Ueberschriften und Filter. Das Signalorange bleibt dem Bestellen vorbehalten.
const categoryThemes: Record<string, CategoryTheme> = {
  'Sauer & Erfrischend': { color: '#c4e04a' },
  'Kräftig & Herb': { color: '#d98a4e' },
  Aperitivos: { color: '#ef5350' },
  'Süß & Fruchtig': { color: '#ff86b0' },
  'Cremig & Kaffee': { color: '#d9c6ad' },
  Puristisch: { color: '#8fd3f0' },
}

const defaultTheme: CategoryTheme = { color: 'var(--accent)' }

export function getCategoryTheme(category: string): CategoryTheme {
  return categoryThemes[category] ?? defaultTheme
}
