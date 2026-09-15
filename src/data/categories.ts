export interface CategoryTheme {
  icon: string
  color: string
}

// Helleren, gesättigten Ton pro Kategorie gewählt (statt der frueheren
// dunkleren Töne fürs helle Theme) - damit `--accent-text` (dunkles
// Smaragdgrün) auf jeder aktiven Filter-Chip-Farbe lesbar bleibt, ohne
// Text pro Kategorie unterscheiden zu muessen.
const categoryThemes: Record<string, CategoryTheme> = {
  'Sauer & Erfrischend': { icon: '🍋', color: '#9bc23c' },
  'Kräftig & Herb': { icon: '🥃', color: '#c2803f' },
  Aperitivos: { icon: '🍊', color: '#f2884a' },
  'Süß & Fruchtig': { icon: '🍓', color: '#e8639d' },
  'Cremig & Kaffee': { icon: '☕', color: '#c4b39f' },
  Puristisch: { icon: '💧', color: '#5cc2ee' },
}

const defaultTheme: CategoryTheme = { icon: '🍸', color: 'var(--accent)' }

export function getCategoryTheme(category: string): CategoryTheme {
  return categoryThemes[category] ?? defaultTheme
}
