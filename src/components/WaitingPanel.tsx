import { useEffect, useRef, useState } from 'react'
import RheinturmClock from './RheinturmClock'
import type { SubmittedOrder } from '../types'

interface WaitingPanelProps {
  order: SubmittedOrder
  position: number
  queueLength: number
  onCancel?: () => void
}

// Ersetzt waehrend einer offenen Bestellung den schlichten Warteschlangen-
// Zaehler: links der Rheinturm mit der echten Uhrzeit, rechts der eigene
// Platz in der Schlange.
function WaitingPanel({ order, position, queueLength, onCancel }: WaitingPanelProps) {
  const drinkName = order.items[0]?.name ?? 'Dein Drink'
  const isNext = position === 1
  const isStarted = Boolean(order.startedAt)
  const ahead = position - 1
  const panelRef = useRef<HTMLElement>(null)
  // Zweistufig, damit ein versehentlicher Tipp nicht gleich storniert.
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)

  // Erscheint die Ansicht (gerade bestellt oder App mit offener Bestellung
  // geoeffnet), rueckt sie den Rheinturm direkt ins Bild. Optionaler Aufruf,
  // weil jsdom in den Tests kein scrollIntoView kennt.
  useEffect(() => {
    panelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <section className="card waiting-panel" ref={panelRef}>
      <RheinturmClock />
      <div className="waiting-info">
        <span className="waiting-label">Du bist</span>
        <span className="waiting-position">
          #{position}
          <span className="waiting-of">/{queueLength}</span>
        </span>
        <span className="waiting-drink">{drinkName}</span>
        <p className="waiting-hint" aria-live="polite">
          {isStarted
            ? 'Dein Drink wird gerade gemixt.'
            : isNext
              ? 'Du bist als Nächstes dran – gleich wird gemixt.'
              : `Noch ${ahead} ${ahead === 1 ? 'Bestellung' : 'Bestellungen'} vor dir.`}
        </p>
        {order.note && <p className="waiting-note">„{order.note}“</p>}
        <ol className="waiting-steps">
          <li className="done">Bestellt</li>
          <li className={isStarted ? 'now mixing' : 'now'}>
            {isStarted ? 'Wird gemixt' : isNext ? 'Du bist dran' : 'Wartet'}
          </li>
          <li>Fertig</li>
        </ol>
        {/* Wird schon gemixt: Stornieren geht dann nicht mehr (Server: 409). */}
        {onCancel &&
          !isStarted &&
          (isConfirmingCancel ? (
            <div className="waiting-cancel">
              <p>Bestellung wirklich stornieren?</p>
              <button type="button" className="btn btn-danger btn-small" onClick={onCancel}>
                Ja, stornieren
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => setIsConfirmingCancel(false)}
              >
                Behalten
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-small waiting-cancel-toggle"
              onClick={() => setIsConfirmingCancel(true)}
            >
              Stornieren
            </button>
          ))}
      </div>
    </section>
  )
}

export default WaitingPanel
