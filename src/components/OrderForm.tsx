import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import type { OrderItem } from '../types'

interface OrderFormProps {
  order: OrderItem[]
  onSubmitOrder: (note: string) => void
  hasOpenOrder: boolean
}

function OrderForm({ order, onSubmitOrder, hasOpenOrder }: OrderFormProps) {
  const [note, setNote] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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
        Anmerkung (optional):
        <textarea
          value={note}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)}
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
