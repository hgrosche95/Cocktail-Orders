import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderBar from './OrderBar'

const order = [{ orderId: 'a', name: 'Mojito' }]
const openOrder = { orderId: 'o1', name: 'Hanna', items: [{ orderId: 'x', name: 'Negroni' }] }

function renderBar(props = {}) {
  const defaults = {
    order,
    onSubmitOrder: () => {},
    onRemoveItem: () => {},
    ownOpenOrder: null,
    queuePosition: 0,
    queueLength: 0,
    isWaitingPanelVisible: false,
    onShowWaitingPanel: () => {},
  }
  return render(<OrderBar {...defaults} {...props} />)
}

describe('OrderBar: vorgemerkter Drink', () => {
  test('stays hidden without a drink and without an open order', () => {
    const { container } = renderBar({ order: [] })

    expect(container).toBeEmptyDOMElement()
  })

  test('submits the drink directly from the bar', async () => {
    const user = userEvent.setup()
    const onSubmitOrder = vi.fn()
    renderBar({ onSubmitOrder })

    expect(screen.getByText('Mojito')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Bestellung abschicken' }))

    expect(onSubmitOrder).toHaveBeenCalledWith('')
  })

  test('removes the drink', async () => {
    const user = userEvent.setup()
    const onRemoveItem = vi.fn()
    renderBar({ onRemoveItem })

    await user.click(screen.getByRole('button', { name: 'Mojito entfernen' }))

    expect(onRemoveItem).toHaveBeenCalledWith('a')
  })

  test('cannot be submitted while another order is open', () => {
    renderBar({ ownOpenOrder: openOrder, queuePosition: 1, queueLength: 1 })

    expect(screen.getByRole('button', { name: 'Bestellung abschicken' })).toBeDisabled()
    expect(screen.getByText('Erst wenn dein offener Drink fertig ist')).toBeInTheDocument()
  })
})

describe('OrderBar: Anmerkung', () => {
  test('shows a pre-filled note (e.g. from the chat order) without opening the details', () => {
    renderBar({ initialNote: 'ohne Eis' })

    expect(screen.getByText('„ohne Eis“')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Anmerkung/)).not.toBeInTheDocument()
  })

  test('the guest can still edit the pre-filled note before submitting', async () => {
    const user = userEvent.setup()
    const onSubmitOrder = vi.fn()
    renderBar({ onSubmitOrder, initialNote: 'ohne Eis' })

    await user.click(screen.getByRole('button', { name: /Mojito/, expanded: false }))
    const textarea = screen.getByLabelText(/Anmerkung/)
    expect(textarea).toHaveValue('ohne Eis')
    await user.clear(textarea)
    await user.type(textarea, 'extra stark')
    await user.click(screen.getByRole('button', { name: 'Bestellung abschicken' }))

    expect(onSubmitOrder).toHaveBeenCalledWith('extra stark')
  })

  test('a re-render with the same initialNote does not overwrite what the guest is typing', async () => {
    const user = userEvent.setup()
    const props = {
      order,
      onSubmitOrder: () => {},
      onRemoveItem: () => {},
      ownOpenOrder: null,
      queuePosition: 0,
      queueLength: 0,
      isWaitingPanelVisible: false,
      onShowWaitingPanel: () => {},
      initialNote: 'ohne Eis',
    }
    const { rerender } = render(<OrderBar {...props} />)

    await user.click(screen.getByRole('button', { name: /Mojito/, expanded: false }))
    const textarea = screen.getByLabelText(/Anmerkung/)
    await user.clear(textarea)
    await user.type(textarea, 'meine eigene Notiz')

    // Gleicher initialNote-Wert wie beim ersten Render - darf die manuelle
    // Eingabe nicht ueberschreiben.
    rerender(<OrderBar {...props} />)

    expect(textarea).toHaveValue('meine eigene Notiz')
  })
})

describe('OrderBar: offene Bestellung', () => {
  test('shows the queue position and jumps to the waiting panel', async () => {
    const user = userEvent.setup()
    const onShowWaitingPanel = vi.fn()
    renderBar({
      order: [],
      ownOpenOrder: openOrder,
      queuePosition: 2,
      queueLength: 3,
      onShowWaitingPanel,
    })

    expect(screen.getByText('Negroni')).toBeInTheDocument()
    expect(screen.getByText('Noch 1 Bestellung vor dir')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Ansehen/ }))

    expect(onShowWaitingPanel).toHaveBeenCalled()
  })

  test('stays hidden while the waiting panel is on screen', () => {
    const { container } = renderBar({
      order: [],
      ownOpenOrder: openOrder,
      queuePosition: 1,
      queueLength: 1,
      isWaitingPanelVisible: true,
    })

    expect(container).toBeEmptyDOMElement()
  })
})
