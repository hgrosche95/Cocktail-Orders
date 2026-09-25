import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import DrinkPage from './DrinkPage'

const daiquiri = {
  id: 3,
  name: 'Daiquiri',
  category: 'Sauer & Erfrischend',
  ingredients: ['Rum', 'Limettensaft', 'Zuckersirup'],
  description: 'Der klassischste Cocktail überhaupt.',
  movie: 'Unser Mann in Havanna',
  recipe: {
    ingredients: [
      { name: 'Rum', amountCl: 6 },
      { name: 'Limettensaft', amountCl: 2.5 },
      { name: 'Zuckersirup', amountCl: 1.5 },
    ],
    ice: 'Shaker zu zwei Dritteln mit Eiswürfeln füllen, kräftig schütteln',
    servedWithIceCubes: false,
  },
}

function renderPage(props = {}) {
  return render(
    <DrinkPage
      cocktail={daiquiri}
      onOrder={() => {}}
      hasOpenOrder={false}
      queueLength={2}
      unavailableIngredients={[]}
      {...props}
    />,
    { wrapper: MemoryRouter }
  )
}

describe('DrinkPage', () => {
  test('shows recipe facts derived from the recipe', () => {
    renderPage()

    expect(screen.getByText('Geschüttelt')).toBeInTheDocument()
    expect(screen.getByText('Ohne Eis')).toBeInTheDocument()
    expect(screen.getByText('10 cl')).toBeInTheDocument()
  })

  test('orders the cocktail with the entered note', async () => {
    const user = userEvent.setup()
    const onOrder = vi.fn()
    renderPage({ onOrder })

    await user.type(screen.getByLabelText(/Anmerkung/), 'extra sauer')
    await user.click(screen.getByRole('button', { name: /Bestellen/ }))

    expect(onOrder).toHaveBeenCalledWith(daiquiri, 'extra sauer')
  })

  test('cannot be ordered when an ingredient is unavailable', () => {
    renderPage({ unavailableIngredients: ['Rum'] })

    expect(screen.getByRole('button', { name: /Heute leider aus/ })).toBeDisabled()
  })

  test('cannot be ordered while the guest has an open order', () => {
    renderPage({ hasOpenOrder: true })

    expect(screen.getByRole('button', { name: /Bestellen/ })).toBeDisabled()
    expect(screen.getByText(/bereits eine offene Bestellung/)).toBeInTheDocument()
  })
})
