import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderHistory from './OrderHistory'

const cableCar = { id: 1, orderId: 'item-a', name: 'Cable Car' }
const negroni = { id: 16, orderId: 'item-b', name: 'Negroni' }

function buildHistory() {
  return [
    { orderId: 'order-2', name: 'Max', items: [negroni], note: '', completedAt: '2026-01-02' },
    { orderId: 'order-1', name: 'Max', items: [cableCar], note: '', completedAt: '2026-01-01' },
  ]
}

describe('OrderHistory', () => {
  test('shows a placeholder when there is no history', async () => {
    const user = userEvent.setup()
    render(<OrderHistory history={[]} ratings={{}} onRate={() => {}} />)

    await user.click(screen.getByText('Meine bisherigen Cocktails'))

    expect(screen.getByText('Noch keine abgeholten Cocktails.')).toBeInTheDocument()
  })

  test('lists each distinct cocktail from the history once', async () => {
    const user = userEvent.setup()
    render(<OrderHistory history={buildHistory()} ratings={{}} onRate={() => {}} />)

    await user.click(screen.getByText('Meine bisherigen Cocktails'))

    expect(screen.getByText('Negroni')).toBeInTheDocument()
    expect(screen.getByText('Cable Car')).toBeInTheDocument()
  })

  test('shows the guest current rating for a cocktail', async () => {
    const user = userEvent.setup()
    render(<OrderHistory history={buildHistory()} ratings={{ 1: 4 }} onRate={() => {}} />)
    await user.click(screen.getByText('Meine bisherigen Cocktails'))

    const cableCarItem = screen.getByText('Cable Car').closest('li')
    const stars = within(cableCarItem).getAllByRole('button')
    expect(stars[3]).toHaveClass('star-filled')
    expect(stars[4]).not.toHaveClass('star-filled')
  })

  test('calls onRate with the cocktail id when a star is clicked', async () => {
    const user = userEvent.setup()
    const onRate = vi.fn()
    render(<OrderHistory history={buildHistory()} ratings={{}} onRate={onRate} />)
    await user.click(screen.getByText('Meine bisherigen Cocktails'))

    const cableCarItem = screen.getByText('Cable Car').closest('li')
    await user.click(within(cableCarItem).getByRole('button', { name: '5 von 5 Sternen' }))

    expect(onRate).toHaveBeenCalledWith(1, 5)
  })
})
