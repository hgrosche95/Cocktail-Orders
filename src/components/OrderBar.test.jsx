import { describe, test, expect, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderBar from './OrderBar'

const order = [{ orderId: 'a', name: 'Mojito' }]
const openOrder = { orderId: 'o1', name: 'Hanna', items: [{ orderId: 'x', name: 'Negroni' }] }

function renderBar(props = {}) {
  const defaults = {
    order,
    onSubmitOrder: () => Promise.resolve('sent'),
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
    const onSubmitOrder = vi.fn().mockResolvedValue('sent')
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

describe('OrderBar: Rueckmeldung beim Abschicken', () => {
  test('shows a sending state and blocks a second tap', async () => {
    const user = userEvent.setup()
    let finish
    const onSubmitOrder = vi.fn(() => new Promise((resolve) => (finish = resolve)))
    renderBar({ onSubmitOrder })

    await user.click(screen.getByRole('button', { name: 'Bestellung abschicken' }))

    expect(screen.getByText('Sendet …')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bestellung abschicken' })).toBeDisabled()
    expect(onSubmitOrder).toHaveBeenCalledTimes(1)

    await act(async () => finish('sent'))
    expect(screen.getByRole('button', { name: 'Bestellung abschicken' })).toBeEnabled()
  })

  test('keeps the note and says so when sending failed', async () => {
    const user = userEvent.setup()
    const onSubmitOrder = vi.fn().mockResolvedValue('failed')
    renderBar({ onSubmitOrder, initialNote: 'ohne Eis' })

    await user.click(screen.getByRole('button', { name: 'Bestellung abschicken' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Versuch es gleich noch einmal')
    expect(screen.getByText('„ohne Eis“')).toBeInTheDocument()
  })

  test('explains a rejected order only while the other order is still open', async () => {
    const user = userEvent.setup()
    const props = {
      order,
      onSubmitOrder: vi.fn().mockResolvedValue('already-open'),
      onRemoveItem: () => {},
      ownOpenOrder: null,
      queuePosition: 0,
      queueLength: 0,
      isWaitingPanelVisible: false,
      onShowWaitingPanel: () => {},
    }
    const { rerender } = render(<OrderBar {...props} />)
    await user.click(screen.getByRole('button', { name: 'Bestellung abschicken' }))

    rerender(<OrderBar {...props} ownOpenOrder={openOrder} queuePosition={1} queueLength={1} />)
    expect(screen.getByRole('alert')).toHaveTextContent('schon eine offene Bestellung')

    rerender(<OrderBar {...props} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('drops the failure message once another drink is selected', async () => {
    const user = userEvent.setup()
    const props = {
      order,
      onSubmitOrder: vi.fn().mockResolvedValue('failed'),
      onRemoveItem: () => {},
      ownOpenOrder: null,
      queuePosition: 0,
      queueLength: 0,
      isWaitingPanelVisible: false,
      onShowWaitingPanel: () => {},
    }
    const { rerender } = render(<OrderBar {...props} />)
    await user.click(screen.getByRole('button', { name: 'Bestellung abschicken' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(<OrderBar {...props} order={[{ orderId: 'b', name: 'Negroni' }]} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
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
    const onSubmitOrder = vi.fn().mockResolvedValue('sent')
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
