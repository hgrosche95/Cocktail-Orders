import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RecipeBar from '../components/RecipeBar'
import { orderErrorMessage } from '../orderResult'
import type { OrderResult } from '../orderResult'
import type { Cocktail } from '../data/cocktails'

// Die Rezeptdaten kennen keine Zubereitungsart als eigenes Feld, sie steckt
// aber verlaesslich im Freitext zur Eis-Anweisung.
function preparationLabel(ice: string): string {
  const text = ice.toLowerCase()
  if (text.includes('shaker') || text.includes('schütteln')) return 'Geschüttelt'
  if (text.includes('rühr')) return 'Gerührt'
  return 'Im Glas'
}

function totalCl(cocktail: Cocktail): number {
  return cocktail.recipe.ingredients.reduce((sum, ingredient) => sum + (ingredient.amountCl ?? 0), 0)
}

interface DrinkPageProps {
  cocktail: Cocktail | undefined
  onOrder: (cocktail: Cocktail, note: string) => Promise<OrderResult>
  hasOpenOrder: boolean
  queueLength: number
  unavailableIngredients: string[]
}

function DrinkPage({ cocktail, onOrder, hasOpenOrder, queueLength, unavailableIngredients }: DrinkPageProps) {
  const [note, setNote] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [failedResult, setFailedResult] = useState<OrderResult | null>(null)
  const navigate = useNavigate()

  // Die Karte kann weit unten gescrollt gewesen sein.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!cocktail) {
    return (
      <div className="card">
        <p>Diesen Drink gibt es auf unserer Karte nicht.</p>
        <Link to="/" className="btn btn-ghost">
          Zur Karte
        </Link>
      </div>
    )
  }

  const isUnavailable = cocktail.ingredients.some((ingredient) =>
    unavailableIngredients.includes(ingredient)
  )
  const volume = totalCl(cocktail)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cocktail || hasOpenOrder || isUnavailable || isSending) return

    setIsSending(true)
    setFailedResult(null)
    const result = await onOrder(cocktail, note)
    setIsSending(false)

    if (result === 'sent') {
      // Zur Karte zurueck - dort erscheint die Warteansicht mit dem Rheinturm
      // und scrollt sich selbst ins Bild.
      navigate('/')
    } else {
      // Hierbleiben: Anmerkung bleibt stehen, ein zweiter Versuch reicht.
      setFailedResult(result)
    }
  }

  return (
    <form className="drink-page" onSubmit={handleSubmit}>
      <p className="drink-meta">{cocktail.category}</p>
      {cocktail.description && <p className="drink-description">{cocktail.description}</p>}

      <RecipeBar recipe={cocktail.recipe} />

      <dl className="drink-facts">
        <div className="card">
          <dt>Zubereitung</dt>
          <dd>{preparationLabel(cocktail.recipe.ice)}</dd>
        </div>
        <div className="card">
          <dt>Serviert</dt>
          <dd>{cocktail.recipe.servedWithIceCubes ? 'Mit Eis' : 'Ohne Eis'}</dd>
        </div>
        <div className="card">
          <dt>Menge</dt>
          <dd>{volume > 0 ? `${String(volume).replace('.', ',')} cl` : '–'}</dd>
        </div>
      </dl>

      <label className="field">
        Anmerkung an die Theke
        <input
          type="text"
          value={note}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setNote(event.target.value)}
          maxLength={200}
          placeholder="z. B. mit Orangenscheibe"
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary btn-block btn-split"
        disabled={hasOpenOrder || isUnavailable || isSending}
      >
        <span>{isUnavailable ? 'Heute leider aus' : isSending ? 'Wird geschickt …' : 'Bestellen'}</span>
        {/* Mit offener Bestellung zaehlt die Schlange den Gast selbst mit. */}
        {!hasOpenOrder && (
          <span className="btn-meta">
            {queueLength} {queueLength === 1 ? 'Bestellung' : 'Bestellungen'} vor dir
          </span>
        )}
      </button>
      {hasOpenOrder ? (
        <p className="error-message">Du hast bereits eine offene Bestellung an der Theke.</p>
      ) : (
        failedResult && (
          <p className="error-message" role="alert">
            {orderErrorMessage(failedResult)}
          </p>
        )
      )}
    </form>
  )
}

export default DrinkPage
