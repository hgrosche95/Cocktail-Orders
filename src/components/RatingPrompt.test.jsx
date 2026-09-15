import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RatingPrompt from './RatingPrompt'

describe('RatingPrompt', () => {
  test('shows the cocktail name', () => {
    render(<RatingPrompt cocktailName="Cable Car" onRate={() => {}} onDismiss={() => {}} />)

    expect(screen.getByText(/Cable Car/)).toBeInTheDocument()
  })

  test('calls onRate with the clicked star number', async () => {
    const user = userEvent.setup()
    const onRate = vi.fn()
    render(<RatingPrompt cocktailName="Cable Car" onRate={onRate} onDismiss={() => {}} />)

    await user.click(screen.getByRole('button', { name: '5 von 5 Sternen' }))

    expect(onRate).toHaveBeenCalledWith(5)
  })

  test('calls onDismiss when "Später" is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<RatingPrompt cocktailName="Cable Car" onRate={() => {}} onDismiss={onDismiss} />)

    await user.click(screen.getByRole('button', { name: 'Später' }))

    expect(onDismiss).toHaveBeenCalled()
  })
})
