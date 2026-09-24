import RheinturmClock from './RheinturmClock'
import type { SubmittedOrder } from '../types'

interface WaitingPanelProps {
  order: SubmittedOrder
  position: number
  queueLength: number
}

// Ersetzt waehrend einer offenen Bestellung den schlichten Warteschlangen-
// Zaehler: links der Rheinturm mit der echten Uhrzeit, rechts der eigene
// Platz in der Schlange.
function WaitingPanel({ order, position, queueLength }: WaitingPanelProps) {
  const drinkName = order.items[0]?.name ?? 'Dein Drink'
  const isNext = position === 1
  const ahead = position - 1

  return (
    <section className="card waiting-panel">
      <RheinturmClock />
      <div className="waiting-info">
        <span className="waiting-label">Du bist</span>
        <span className="waiting-position">
          #{position}
          <span className="waiting-of">/{queueLength}</span>
        </span>
        <span className="waiting-drink">{drinkName}</span>
        <p className="waiting-hint" aria-live="polite">
          {isNext
            ? 'Du bist als Nächstes dran – gleich wird gemixt.'
            : `Noch ${ahead} ${ahead === 1 ? 'Bestellung' : 'Bestellungen'} vor dir.`}
        </p>
        {order.note && <p className="waiting-note">„{order.note}“</p>}
        <ol className="waiting-steps">
          <li className="done">Bestellt</li>
          <li className="now">{isNext ? 'Du bist dran' : 'Wartet'}</li>
          <li>Fertig</li>
        </ol>
      </div>
    </section>
  )
}

export default WaitingPanel
