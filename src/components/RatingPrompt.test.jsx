import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RatingPrompt from './RatingPrompt'

describe('RatingPrompt', () => {
  test('shows the cocktail name', () => {
    render(<RatingPrompt cocktailName="Cable Car" onRate={() => {}} onDismiss={() => {}} />)

    expect(screen.getByText(/Cable Car/)).toBeInTheDocument()
  })

  test('keeps the stars hidden until it is opened', async () => {
    const user = userEvent.setup()
    render(<RatingPrompt cocktailName="Cable Car" onRate={() => {}} onDismiss={() => {}} />)

    const toggle = screen.getByRole('button', { name: /Cable Car/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: '5 von 5 Sternen' })).not.toBeInTheDocument()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: '5 von 5 Sternen' })).toBeInTheDocument()
  })

  test('calls onRate with the clicked star number', async () => {
    const user = userEvent.setup()
    const onRate = vi.fn()
    render(<RatingPrompt cocktailName="Cable Car" onRate={onRate} onDismiss={() => {}} />)

    await user.click(screen.getByRole('button', { name: /Cable Car/ }))
    await user.click(screen.getByRole('button', { name: '5 von 5 Sternen' }))

    expect(onRate).toHaveBeenCalledWith(5)
  })

  test('calls onDismiss when "Später" is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<RatingPrompt cocktailName="Cable Car" onRate={() => {}} onDismiss={onDismiss} />)

    await user.click(screen.getByRole('button', { name: /Cable Car/ }))
    await user.click(screen.getByRole('button', { name: 'Später' }))

    expect(onDismiss).toHaveBeenCalled()
  })
})
