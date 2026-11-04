import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import RecipeBar from './RecipeBar'
import type { OrderItem, SubmittedOrder } from '../types'

interface OrderBarProps {
  order: OrderItem[]
  onSubmitOrder: (note: string) => void
  onRemoveItem: (orderId: string) => void
  initialNote?: string
  ownOpenOrder: SubmittedOrder | null
  queuePosition: number
  queueLength: number
  isWaitingPanelVisible: boolean
  onShowWaitingPanel: () => void
}

function waitingHint(order: SubmittedOrder, position: number): string {
  if (order.startedAt) return 'Wird gerade gemixt'
  if (position === 1) return 'Du bist als Nächstes dran'
  const ahead = position - 1
  return `Noch ${ahead} ${ahead === 1 ? 'Bestellung' : 'Bestellungen'} vor dir`
}

// Bleibt beim Scrollen am unteren Rand, in Daumenreichweite: "+" auf einer
// Karte merkt den Drink hier vor, abgeschickt wird direkt aus der Leiste.
// Mit offener Bestellung zeigt sie stattdessen den Platz in der Schlange,
// solange die grosse Warteansicht nicht ohnehin im Bild ist.
function OrderBar({
  order,
  onSubmitOrder,
  onRemoveItem,
  initialNote,
  ownOpenOrder,
  queuePosition,
  queueLength,
  isWaitingPanelVisible,
  onShowWaitingPanel,
}: OrderBarProps) {
  const [note, setNote] = useState(initialNote ?? '')
  const [isExpanded, setIsExpanded] = useState(false)

  // "State waehrend des Renderns anpassen" (React-Ersatz fuer
  // getDerivedStateFromProps) statt setState in einem Effect: initialNote
  // kommt z.B. von der Chat-Bestellung, wo die KI eine Zubereitungsvorgabe
  // ("ohne Eis") aus dem Freitext erkannt hat - der Gast sieht/bearbeitet sie
  // hier ganz normal weiter, bevor er abschickt.
  const [prevInitialNote, setPrevInitialNote] = useState(initialNote)
  if (initialNote !== prevInitialNote) {
    setPrevInitialNote(initialNote)
    if (initialNote) setNote(initialNote)
  }

  const drink = order[0]

  if (!drink) {
    if (!ownOpenOrder || isWaitingPanelVisible) return null

    return (
      <div className="order-bar">
        <button type="button" className="order-bar-status" onClick={onShowWaitingPanel}>
          <span className="order-bar-position">
            #{queuePosition}
            <span className="order-bar-position-of">/{queueLength}</span>
          </span>
          <span className="order-bar-summary-text">
            <span className="order-bar-name">{ownOpenOrder.items[0]?.name ?? 'Dein Drink'}</span>
            <span className="order-bar-hint">{waitingHint(ownOpenOrder, queuePosition)}</span>
          </span>
          <span className="order-bar-link">Ansehen</span>
        </button>
      </div>
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (ownOpenOrder) return

    onSubmitOrder(note)
    setNote('')
    setIsExpanded(false)
  }

  let summaryHint = 'Anmerkung hinzufügen'
  if (note) summaryHint = `„${note}“`
  else if (ownOpenOrder) summaryHint = 'Erst wenn dein offener Drink fertig ist'

  return (
    <form className="order-bar" onSubmit={handleSubmit}>
      {isExpanded && (
        <div className="order-bar-details" id="order-bar-details">
          {drink.recipe && <RecipeBar recipe={drink.recipe} />}
          <label className="field">
            Anmerkung an die Theke (optional)
            <textarea
              value={note}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)}
              maxLength={200}
            />
          </label>
        </div>
      )}
      <div className="order-bar-row">
        <button
          type="button"
          className="order-bar-summary"
          aria-expanded={isExpanded}
          aria-controls="order-bar-details"
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <span className="order-bar-summary-text" aria-live="polite">
            <span className="order-bar-name" key={drink.orderId}>
              {drink.name}
            </span>
            <span className={note ? 'order-bar-hint' : 'order-bar-hint order-bar-hint-action'}>
              {summaryHint}
            </span>
          </span>
          <svg className="order-bar-chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
            <path d="M2 8l4-4 4 4" />
          </svg>
        </button>
        <button
          type="button"
          className="order-bar-remove"
          aria-label={`${drink.name} entfernen`}
          onClick={() => onRemoveItem(drink.orderId)}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
          </svg>
        </button>
        <button
          type="submit"
          className="btn btn-primary order-bar-submit"
          aria-label="Bestellung abschicken"
          disabled={ownOpenOrder !== null}
        >
          Abschicken
        </button>
      </div>
    </form>
  )
}

export default OrderBar
