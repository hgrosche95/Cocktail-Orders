import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CocktailCard from './CocktailCard'

// Die Karten verlinken auf die Detailansicht und brauchen deshalb einen Router.
const renderWithRouter = (ui) => render(ui, { wrapper: MemoryRouter })

const cocktail = {
  id: 1,
  name: 'Mojito',
  ingredients: ['Rum', 'Zucker', 'Limette', 'Minze', 'Soda'],
  description: 'Ein erfrischender Drink.',
  movie: 'Die Another Day',
}

describe('CocktailCard', () => {
  test('renders name, ingredients, description and movie', () => {
    renderWithRouter(<CocktailCard cocktail={cocktail} onAddToOrder={() => {}} />)

    expect(screen.getByText('Mojito')).toBeInTheDocument()
    for (const ingredient of cocktail.ingredients) {
      expect(screen.getByText(ingredient)).toBeInTheDocument()
    }
    expect(screen.getByText('Ein erfrischender Drink.')).toBeInTheDocument()
    expect(screen.getByText(/Die Another Day/)).toBeInTheDocument()
  })

  test('does not render a description when there is none', () => {
    const cocktailWithoutDescription = { ...cocktail, description: undefined }

    renderWithRouter(<CocktailCard cocktail={cocktailWithoutDescription} onAddToOrder={() => {}} />)

    expect(screen.queryByText('Ein erfrischender Drink.')).not.toBeInTheDocument()
  })

  test('calls onAddToOrder with the cocktail when clicked', async () => {
    const user = userEvent.setup()
    const onAddToOrder = vi.fn()
    renderWithRouter(<CocktailCard cocktail={cocktail} onAddToOrder={onAddToOrder} />)

    await user.click(screen.getByRole('button', { name: 'Mojito bestellen' }))

    expect(onAddToOrder).toHaveBeenCalledWith(cocktail)
  })
})
