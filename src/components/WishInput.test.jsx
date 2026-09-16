import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WishInput from './WishInput'

describe('WishInput', () => {
  test('calls onSubmit with the typed text', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<WishInput onSubmit={onSubmit} isLoading={false} />)

    await user.type(screen.getByPlaceholderText(/Fruchtiges/), 'etwas Bitteres, kein Rum')
    await user.click(screen.getByRole('button', { name: 'Vorschläge finden' }))

    expect(onSubmit).toHaveBeenCalledWith('etwas Bitteres, kein Rum')
  })

  test('does not call onSubmit for empty or whitespace-only input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<WishInput onSubmit={onSubmit} isLoading={false} />)

    await user.type(screen.getByPlaceholderText(/Fruchtiges/), '   ')
    await user.click(screen.getByRole('button', { name: 'Vorschläge finden' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('shows a loading state and disables the button while searching', () => {
    render(<WishInput onSubmit={() => {}} isLoading={true} />)

    const button = screen.getByRole('button', { name: 'Wird gesucht …' })
    expect(button).toBeDisabled()
  })
})
