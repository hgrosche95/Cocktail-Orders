export interface CategoryTheme {
  icon: string
  color: string
}

const categoryThemes: Record<string, CategoryTheme> = {
  'Sauer & Erfrischend': { icon: '🍋', color: '#65a30d' },
  'Kräftig & Herb': { icon: '🥃', color: '#92400e' },
  Aperitivos: { icon: '🍊', color: '#ea580c' },
  'Süß & Fruchtig': { icon: '🍓', color: '#db2777' },
  'Cremig & Kaffee': { icon: '☕', color: '#44403c' },
  Puristisch: { icon: '💧', color: '#0284c7' },
}

const defaultTheme: CategoryTheme = { icon: '🍸', color: 'var(--accent)' }

export function getCategoryTheme(category: string): CategoryTheme {
  return categoryThemes[category] ?? defaultTheme
}
