import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StarRating from './StarRating'

describe('StarRating', () => {
  test('renders 5 stars', () => {
    render(<StarRating value={0} onRate={() => {}} />)

    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  test('fills stars up to the given value', () => {
    render(<StarRating value={3} onRate={() => {}} />)

    const stars = screen.getAllByRole('button')
    expect(stars[0]).toHaveClass('star-filled')
    expect(stars[2]).toHaveClass('star-filled')
    expect(stars[3]).not.toHaveClass('star-filled')
  })

  test('calls onRate with the clicked star number', async () => {
    const user = userEvent.setup()
    const onRate = vi.fn()
    render(<StarRating value={0} onRate={onRate} />)

    await user.click(screen.getByRole('button', { name: '4 von 5 Sternen' }))

    expect(onRate).toHaveBeenCalledWith(4)
  })

  test('is read-only (disabled) when no onRate is given', () => {
    render(<StarRating value={2} />)

    for (const star of screen.getAllByRole('button')) {
      expect(star).toBeDisabled()
    }
  })
})
