import { useState } from 'react'

function OrderForm({ order, onSubmitOrder, hasOpenOrder }) {
  const [note, setNote] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (hasOpenOrder) {
      setErrorMessage('Du hast bereits eine offene Bestellung beim Barkeeper.')
      return
    }

    onSubmitOrder(note)
    setNote('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Anmerkung (optional):
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button type="submit" disabled={order.length === 0}>
        Bestellung abschicken
      </button>
      {errorMessage && <p>{errorMessage}</p>}
    </form>
  )
}

export default OrderForm