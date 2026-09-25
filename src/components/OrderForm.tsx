import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import type { OrderItem } from '../types'

interface OrderFormProps {
  order: OrderItem[]
  onSubmitOrder: (note: string) => void
  hasOpenOrder: boolean
  initialNote?: string
}

function OrderForm({ order, onSubmitOrder, hasOpenOrder, initialNote }: OrderFormProps) {
  const [note, setNote] = useState(initialNote ?? '')
  const [errorMessage, setErrorMessage] = useState('')

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (hasOpenOrder) {
      setErrorMessage('Du hast bereits eine offene Bestellung beim Barkeeper.')
      return
    }

    onSubmitOrder(note)
    setNote('')
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <label className="field">
        Anmerkung an die Theke (optional)
        <textarea
          value={note}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)}
          maxLength={200}
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block" disabled={order.length === 0}>
        Bestellung abschicken
      </button>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </form>
  )
}

export default OrderForm
