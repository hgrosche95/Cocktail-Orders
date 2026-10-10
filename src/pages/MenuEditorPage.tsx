import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMenu } from '../data/menu'
import type { RecipeIngredient } from '../data/cocktails'

// Was das Formular an den Server schickt (POST /api/menu). Der Server prueft
// alles noch einmal und baut daraus den Karteneintrag.
export interface NewCocktail {
  name: string
  category: string
  movie: string
  description: string
  recipe: {
    ingredients: RecipeIngredient[]
    ice: string
    servedWithIceCubes: boolean
  }
}

interface IngredientRow {
  name: string
  amountCl: string
  note: string
}

const MAX_INGREDIENTS = 12

function emptyRow(): IngredientRow {
  return { name: '', amountCl: '', note: '' }
}

// "4,5" und "4.5" sind beide gemeint; leer = keine Mengenangabe.
function parseAmount(value: string): number | undefined {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return undefined
  return Number(normalized)
}

interface MenuEditorPageProps {
  onAdd: (input: NewCocktail) => Promise<string | null>
  onRemove: (id: number) => void
}

function MenuEditorPage({ onAdd, onRemove }: MenuEditorPageProps) {
  const menu = useMenu()
  const categories = [...new Set(menu.map((cocktail) => cocktail.category))]
  const knownIngredients = [
    ...new Set(menu.flatMap((cocktail) => cocktail.recipe.ingredients.map((i) => i.name))),
  ].sort((a, b) => a.localeCompare(b, 'de'))
  const customCocktails = menu.filter((cocktail) => cocktail.custom)

  const [name, setName] = useState('')
  const [category, setCategory] = useState(categories[0] ?? '')
  const [movie, setMovie] = useState('')
  const [description, setDescription] = useState('')
  const [rows, setRows] = useState<IngredientRow[]>([emptyRow()])
  const [ice, setIce] = useState('')
  const [servedWithIceCubes, setServedWithIceCubes] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null)

  function updateRow(index: number, patch: Partial<IngredientRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(null)

    const filledRows = rows.filter((row) => row.name.trim())
    if (!name.trim()) {
      setError('Der Drink braucht einen Namen.')
      return
    }
    if (filledRows.length === 0) {
      setError('Mindestens eine Zutat angeben.')
      return
    }
    const ingredients: RecipeIngredient[] = []
    for (const row of filledRows) {
      const amountCl = parseAmount(row.amountCl)
      if (amountCl !== undefined && !(amountCl > 0 && amountCl <= 50)) {
        setError(`Menge für ${row.name.trim()}: eine Zahl zwischen 0 und 50 cl.`)
        return
      }
      ingredients.push({
        name: row.name.trim(),
        ...(amountCl !== undefined && { amountCl }),
        ...(row.note.trim() && { note: row.note.trim() }),
      })
    }

    setError(null)
    setIsSaving(true)
    const cocktailName = name.trim()
    onAdd({
      name: cocktailName,
      category,
      movie,
      description,
      recipe: { ingredients, ice, servedWithIceCubes },
    })
      .then((message) => {
        if (message) {
          setError(message)
          return
        }
        setSaved(`„${cocktailName}“ steht jetzt auf der Karte.`)
        setName('')
        setMovie('')
        setDescription('')
        setRows([emptyRow()])
        setIce('')
        setServedWithIceCubes(false)
      })
      .finally(() => setIsSaving(false))
  }

  return (
    <div className="menu-editor">
      <div className="stats-header">
        <Link to="/barkeeper" className="back-link back-link-inline">
          ← Theke
        </Link>
      </div>

      <h2>Karte</h2>

      <section className="card">
        <h3>Eigene Drinks</h3>
        {customCocktails.length === 0 ? (
          <p className="order-empty">Noch keine eigenen Drinks – leg unten den ersten an.</p>
        ) : (
          <ul className="custom-cocktail-list">
            {customCocktails.map((cocktail) => (
              <li key={cocktail.id} className="custom-cocktail">
                <div>
                  <Link to={`/drink/${cocktail.id}`} className="custom-cocktail-name">
                    {cocktail.name}
                  </Link>
                  <p className="custom-cocktail-meta">
                    {cocktail.category} · {cocktail.ingredients.join(', ')}
                  </p>
                </div>
                {confirmRemoveId === cocktail.id ? (
                  <div className="custom-cocktail-actions">
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => {
                        setConfirmRemoveId(null)
                        onRemove(cocktail.id)
                      }}
                    >
                      Ja, entfernen
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={() => setConfirmRemoveId(null)}
                    >
                      Behalten
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    aria-label={`${cocktail.name} entfernen`}
                    onClick={() => setConfirmRemoveId(cocktail.id)}
                  >
                    Entfernen
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form className="card menu-form" onSubmit={handleSubmit} noValidate>
        <h3>Neuer Drink</h3>

        <label className="field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
        </label>

        <label className="field">
          Kategorie
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Film (optional)
          <input value={movie} onChange={(e) => setMovie(e.target.value)} maxLength={80} />
        </label>

        <label className="field">
          Beschreibung (optional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
          />
        </label>

        <fieldset className="ingredient-rows">
          <legend>Zutaten</legend>
          <p className="section-hint">
            Gleiche Namen wie im Bestand verwenden, dann greift „leer“ auch für den neuen Drink.
          </p>
          <datalist id="known-ingredients">
            {knownIngredients.map((ingredient) => (
              <option key={ingredient} value={ingredient} />
            ))}
          </datalist>
          {rows.map((row, index) => (
            <div key={index} className="ingredient-row">
              <input
                aria-label={`Zutat ${index + 1}`}
                placeholder="Zutat"
                list="known-ingredients"
                value={row.name}
                onChange={(e) => updateRow(index, { name: e.target.value })}
                maxLength={40}
              />
              <input
                aria-label={`Menge in cl für Zutat ${index + 1}`}
                placeholder="cl"
                inputMode="decimal"
                value={row.amountCl}
                onChange={(e) => updateRow(index, { amountCl: e.target.value })}
                className="ingredient-amount"
              />
              <input
                aria-label={`Hinweis für Zutat ${index + 1}`}
                placeholder="Hinweis (optional)"
                value={row.note}
                onChange={(e) => updateRow(index, { note: e.target.value })}
                maxLength={80}
              />
              <button
                type="button"
                className="btn btn-ghost btn-small"
                aria-label={`Zutat ${index + 1} entfernen`}
                disabled={rows.length === 1}
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-small"
            disabled={rows.length >= MAX_INGREDIENTS}
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
          >
            + Zutat
          </button>
        </fieldset>

        <label className="field">
          Eis / Zubereitung (optional)
          <input
            value={ice}
            onChange={(e) => setIce(e.target.value)}
            maxLength={150}
            placeholder="z. B. Im Shaker mit Eis schütteln"
          />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={servedWithIceCubes}
            onChange={(e) => setServedWithIceCubes(e.target.checked)}
          />
          Mit Eiswürfeln im Glas serviert
        </label>

        {error && <p className="error-message">{error}</p>}
        {saved && (
          <p className="success-message" role="status">
            {saved}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={isSaving}>
          Auf die Karte setzen
        </button>
      </form>
    </div>
  )
}

export default MenuEditorPage
