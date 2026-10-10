import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export interface Stats {
  servedDrinks: number
  guests: number
  openOrders: number
  averageRating: number | null
  ratingCount: number
  topCocktails: { cocktailId: number; name: string; count: number }[]
  topRated: { cocktailId: number; name: string; averageRating: number; ratingCount: number }[]
  ingredientUsage: { ingredient: string; totalCl: number | null; drinks: number }[]
}

type Range = 'day' | 'all'

const DAY_MS = 24 * 60 * 60 * 1000

interface StatsPageProps {
  loadStats: (since: string | null) => Promise<Stats | null>
  // Aendert sich bei jeder Live-Aenderung (Bestellung erledigt, Bewertung
  // ...), damit die Zahlen ohne Neuladen mitlaufen.
  liveVersion: number
}

function formatNumber(value: number): string {
  return value.toLocaleString('de-DE', { maximumFractionDigits: 1 })
}

// Eine Zeile einer sortierten Balkenliste: Name, Balken relativ zum
// groessten Wert, Wert als Text daneben (die Zahl steht immer da, der
// Balken ist nur die Orientierung).
function BarRow({ label, value, max, text }: { label: string; value: number; max: number; text: string }) {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 0
  return (
    <li className="stats-bar-row">
      <span className="stats-bar-label">{label}</span>
      <span className="stats-bar-track" aria-hidden="true">
        <span className="stats-bar" style={{ width: `${width}%` }} />
      </span>
      <span className="stats-bar-value">{text}</span>
    </li>
  )
}

function StatsPage({ loadStats, liveVersion }: StatsPageProps) {
  const [range, setRange] = useState<Range>('day')
  const [stats, setStats] = useState<Stats | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isCurrent = true
    const since = range === 'day' ? new Date(Date.now() - DAY_MS).toISOString() : null
    loadStats(since).then(
      (result) => {
        if (!isCurrent) return
        setStats(result)
        setHasError(result === null)
      },
      () => isCurrent && setHasError(true)
    )
    return () => {
      isCurrent = false
    }
  }, [loadStats, range, liveVersion])

  const withAmount = stats?.ingredientUsage.filter((entry) => entry.totalCl !== null) ?? []
  const withoutAmount = stats?.ingredientUsage.filter((entry) => entry.totalCl === null) ?? []

  return (
    <div className="stats-page">
      <div className="stats-header">
        <Link to="/barkeeper" className="back-link back-link-inline">
          ← Theke
        </Link>
        <div className="stats-range" role="group" aria-label="Zeitraum">
          <button
            type="button"
            className={range === 'day' ? 'filter-chip active' : 'filter-chip'}
            aria-pressed={range === 'day'}
            onClick={() => setRange('day')}
          >
            Letzte 24 h
          </button>
          <button
            type="button"
            className={range === 'all' ? 'filter-chip active' : 'filter-chip'}
            aria-pressed={range === 'all'}
            onClick={() => setRange('all')}
          >
            Gesamt
          </button>
        </div>
      </div>

      <h2>Statistik</h2>

      {hasError && <p className="error-message">Statistik konnte nicht geladen werden.</p>}
      {!stats && !hasError && <p className="order-empty">Lädt …</p>}

      {stats && (
        <>
          <dl className="stats-tiles">
            <div className="card stats-tile">
              <dt>Serviert</dt>
              <dd>{stats.servedDrinks}</dd>
            </div>
            <div className="card stats-tile">
              <dt>Gäste</dt>
              <dd>{stats.guests}</dd>
            </div>
            <div className="card stats-tile">
              <dt>Offen</dt>
              <dd>{stats.openOrders}</dd>
            </div>
            <div className="card stats-tile">
              <dt>Ø Bewertung</dt>
              <dd>
                {stats.averageRating === null ? '–' : `${formatNumber(stats.averageRating)} ★`}
              </dd>
            </div>
          </dl>

          <section className="card">
            <h3>Meistbestellt</h3>
            {stats.topCocktails.length === 0 ? (
              <p className="order-empty">Noch nichts serviert.</p>
            ) : (
              <ol className="stats-bars">
                {stats.topCocktails.map((entry) => (
                  <BarRow
                    key={entry.cocktailId}
                    label={entry.name}
                    value={entry.count}
                    max={stats.topCocktails[0].count}
                    text={`${entry.count}×`}
                  />
                ))}
              </ol>
            )}
          </section>

          <section className="card">
            <h3>Beste Bewertungen</h3>
            {stats.topRated.length === 0 ? (
              <p className="order-empty">Noch keine Bewertungen.</p>
            ) : (
              <ol className="stats-bars">
                {stats.topRated.map((entry) => (
                  <BarRow
                    key={entry.cocktailId}
                    label={entry.name}
                    value={entry.averageRating}
                    max={5}
                    text={`${formatNumber(entry.averageRating)} ★ (${entry.ratingCount})`}
                  />
                ))}
              </ol>
            )}
          </section>

          <section className="card">
            <h3>Verbrauch</h3>
            <p className="section-hint">Laut Rezept, für den nächsten Einkauf.</p>
            {stats.ingredientUsage.length === 0 ? (
              <p className="order-empty">Noch nichts verbraucht.</p>
            ) : (
              <>
                <ul className="stats-bars">
                  {withAmount.map((entry) => (
                    <BarRow
                      key={entry.ingredient}
                      label={entry.ingredient}
                      value={entry.totalCl ?? 0}
                      max={withAmount[0].totalCl ?? 0}
                      text={`${formatNumber(entry.totalCl ?? 0)} cl`}
                    />
                  ))}
                </ul>
                {withoutAmount.length > 0 && (
                  <p className="stats-extra">
                    Ohne Mengenangabe:{' '}
                    {withoutAmount
                      .map((entry) => `${entry.ingredient} (${entry.drinks} ${entry.drinks === 1 ? 'Drink' : 'Drinks'})`)
                      .join(', ')}
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default StatsPage
