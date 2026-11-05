import { useEffect, useId, useRef, useState } from 'react'

function HelpGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const titleId = useId()
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    // Schliessen ist das einzige Bedienelement im Dialog, Tab bleibt deshalb
    // dort. Pfeiltasten scrollen den Text trotzdem.
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
      if (event.key === 'Tab') {
        event.preventDefault()
        closeButtonRef.current?.focus()
      }
    }

    const openButton = openButtonRef.current
    closeButtonRef.current?.focus()
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      openButton?.focus()
    }
  }, [isOpen])

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        className="help-button"
        onClick={() => setIsOpen(true)}
        aria-label="Hilfe anzeigen"
      >
        ?
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="card modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="btn btn-ghost btn-small modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Schließen"
            >
              ✕
            </button>

            <h2 id={titleId}>So funktioniert's</h2>

            <h3>Bestellen</h3>
            <p>
              Cocktail aus der Karte wählen und auf „+" tippen: Er landet in der Leiste unten. Dort optional eine
              Anmerkung hinzufügen (z.&nbsp;B. „wenig Eis") und abschicken. Sobald der
              Barkeeper deinen Cocktail zubereitet hat, bekommst du eine Benachrichtigung.
            </p>

            <h3>„Worauf hast du Lust?": in eigenen Worten bestellen</h3>
            <p>Beschreib einfach, worauf du Lust hast, zum Beispiel:</p>
            <ul>
              <li>„etwas Fruchtiges, nicht zu stark"</li>
              <li>„einen Negroni, aber ohne Eis"</li>
              <li>„etwas Bitteres, kein Rum"</li>
            </ul>
            <p>
              Ist die Antwort eindeutig, landet der Cocktail direkt in deiner Bestellung
              (inklusive erkannter Anmerkung wie „ohne Eis"). Du musst nur noch bestätigen.
              Bei mehreren passenden Cocktails zeigen wir dir stattdessen eine Auswahl.
            </p>

            <h3>Bewerten für bessere Empfehlungen</h3>
            <p>
              Nachdem du einen Cocktail abgeholt hast, kannst du ihn bewerten (1-5 Sterne):
              direkt beim nächsten Bestellen oder jederzeit unter „Meine bisherigen
              Cocktails". Je mehr Gäste bewerten, desto besser werden die Vorschläge unter
              „Unser Tipp für dich".
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default HelpGuide
