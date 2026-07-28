import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderSummary from './OrderSummary'

describe('OrderSummary', () => {
  test('shows a placeholder when the order is empty', () => {
    render(<OrderSummary order={[]} onRemoveItem={() => {}} />)

    expect(screen.getByText('Noch nichts bestellt.')).toBeInTheDocument()
  })

  test('lists the cocktails in the order', () => {
    const order = [{ orderId: 'a', name: 'Mojito' }]

    render(<OrderSummary order={order} onRemoveItem={() => {}} />)

    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.queryByText('Noch nichts bestellt.')).not.toBeInTheDocument()
  })

  test('calls onRemoveItem with the orderId when "Entfernen" is clicked', async () => {
    const user = userEvent.setup()
    const onRemoveItem = vi.fn()
    const order = [{ orderId: 'a', name: 'Mojito' }]

    render(<OrderSummary order={order} onRemoveItem={onRemoveItem} />)
    await user.click(screen.getByRole('button', { name: 'Entfernen' }))

    expect(onRemoveItem).toHaveBeenCalledWith('a')
  })
})
