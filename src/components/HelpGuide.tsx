import { useEffect, useState } from 'react'

function HelpGuide() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        className="help-button"
        onClick={() => setIsOpen(true)}
        aria-label="Hilfe anzeigen"
      >
        ?
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="card modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="btn btn-ghost btn-small modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Schließen"
            >
              ✕
            </button>

            <h2>So funktioniert's</h2>

            <h3>Bestellen</h3>
            <p>
              Cocktail aus der Karte wählen und auf „+" tippen. Optional eine
              Anmerkung hinzufügen (z.&nbsp;B. „wenig Eis") und abschicken. Sobald der
              Barkeeper deinen Cocktail zubereitet hat, bekommst du eine Benachrichtigung.
            </p>

            <h3>„Worauf hast du Lust?" — in eigenen Worten bestellen</h3>
            <p>Beschreib einfach, worauf du Lust hast, zum Beispiel:</p>
            <ul>
              <li>„etwas Fruchtiges, nicht zu stark"</li>
              <li>„einen Negroni, aber ohne Eis"</li>
              <li>„etwas Bitteres, kein Rum"</li>
            </ul>
            <p>
              Ist die Antwort eindeutig, landet der Cocktail direkt in deiner Bestellung
              (inklusive erkannter Anmerkung wie „ohne Eis") — du musst nur noch bestätigen.
              Bei mehreren passenden Cocktails zeigen wir dir stattdessen eine Auswahl.
            </p>

            <h3>Bewerten für bessere Empfehlungen</h3>
            <p>
              Nachdem du einen Cocktail abgeholt hast, kannst du ihn bewerten (1-5 Sterne) —
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
