import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CocktailCard from './CocktailCard'

const cocktail = {
  id: 1,
  name: 'Mojito',
  ingredients: ['Rum', 'Zucker', 'Limette', 'Minze', 'Soda'],
  description: 'Ein erfrischender Drink.',
  movie: 'Die Another Day',
}

describe('CocktailCard', () => {
  test('renders name, ingredients, description and movie', () => {
    render(<CocktailCard cocktail={cocktail} onAddToOrder={() => {}} />)

    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText('Rum · Zucker · Limette · Minze · Soda')).toBeInTheDocument()
    expect(screen.getByText('Ein erfrischender Drink.')).toBeInTheDocument()
    expect(screen.getByText(/Die Another Day/)).toBeInTheDocument()
  })

  test('does not render a description when there is none', () => {
    const cocktailWithoutDescription = { ...cocktail, description: undefined }

    render(<CocktailCard cocktail={cocktailWithoutDescription} onAddToOrder={() => {}} />)

    expect(screen.queryByText('Ein erfrischender Drink.')).not.toBeInTheDocument()
  })

  test('calls onAddToOrder with the cocktail when clicked', async () => {
    const user = userEvent.setup()
    const onAddToOrder = vi.fn()
    render(<CocktailCard cocktail={cocktail} onAddToOrder={onAddToOrder} />)

    await user.click(screen.getByRole('button', { name: 'Bestellen' }))

    expect(onAddToOrder).toHaveBeenCalledWith(cocktail)
  })
})
