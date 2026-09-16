import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderForm from './OrderForm'

const order = [{ orderId: 'a', name: 'Mojito' }]

describe('OrderForm initialNote', () => {
  test('pre-fills the note from initialNote (e.g. from the chat order)', () => {
    render(
      <OrderForm order={order} onSubmitOrder={() => {}} hasOpenOrder={false} initialNote="ohne Eis" />
    )

    expect(screen.getByLabelText(/Anmerkung/)).toHaveValue('ohne Eis')
  })

  test('the guest can still edit the pre-filled note before submitting', async () => {
    const user = userEvent.setup()
    const onSubmitOrder = vi.fn()
    render(
      <OrderForm
        order={order}
        onSubmitOrder={onSubmitOrder}
        hasOpenOrder={false}
        initialNote="ohne Eis"
      />
    )

    const textarea = screen.getByLabelText(/Anmerkung/)
    await user.clear(textarea)
    await user.type(textarea, 'extra stark')
    await user.click(screen.getByRole('button', { name: 'Bestellung abschicken' }))

    expect(onSubmitOrder).toHaveBeenCalledWith('extra stark')
  })

  test('a re-render with the same initialNote does not overwrite what the guest is typing', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <OrderForm order={order} onSubmitOrder={() => {}} hasOpenOrder={false} initialNote="ohne Eis" />
    )

    const textarea = screen.getByLabelText(/Anmerkung/)
    await user.clear(textarea)
    await user.type(textarea, 'meine eigene Notiz')

    // Gleicher initialNote-Wert wie beim ersten Render - darf die manuelle
    // Eingabe nicht ueberschreiben.
    rerender(
      <OrderForm order={order} onSubmitOrder={() => {}} hasOpenOrder={false} initialNote="ohne Eis" />
    )

    expect(textarea).toHaveValue('meine eigene Notiz')
  })
})
