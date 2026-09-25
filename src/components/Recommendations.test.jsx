import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Recommendations from './Recommendations'

// Die Karten verlinken auf die Detailansicht und brauchen deshalb einen Router.
const renderWithRouter = (ui) => render(ui, { wrapper: MemoryRouter })

// Mojito: id 6, braucht Rum. Negroni: id 16, braucht keinen Rum.
describe('Recommendations', () => {
  test('renders nothing when there are no recommendations', () => {
    const { container } = renderWithRouter(
      <Recommendations
        recommendations={[]}
        unavailableIngredients={[]}
        onAddToOrder={() => {}}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('shows the recommended cocktails', () => {
    renderWithRouter(
      <Recommendations
        recommendations={[
          { cocktailId: 6, predictedRating: 4.5 },
          { cocktailId: 16, predictedRating: 4 },
        ]}
        unavailableIngredients={[]}
        onAddToOrder={() => {}}
      />
    )

    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText('Negroni')).toBeInTheDocument()
  })

  test('hides a recommended cocktail that needs an unavailable ingredient', () => {
    renderWithRouter(
      <Recommendations
        recommendations={[
          { cocktailId: 6, predictedRating: 4.5 },
          { cocktailId: 16, predictedRating: 4 },
        ]}
        unavailableIngredients={['Rum']}
        onAddToOrder={() => {}}
      />
    )

    expect(screen.queryByText('Mojito')).not.toBeInTheDocument()
    expect(screen.getByText('Negroni')).toBeInTheDocument()
  })

  test('calls onAddToOrder when a recommended cocktail is ordered', async () => {
    const user = userEvent.setup()
    const onAddToOrder = vi.fn()
    renderWithRouter(
      <Recommendations
        recommendations={[{ cocktailId: 16, predictedRating: 4 }]}
        unavailableIngredients={[]}
        onAddToOrder={onAddToOrder}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Negroni bestellen' }))

    expect(onAddToOrder).toHaveBeenCalledWith(expect.objectContaining({ id: 16, name: 'Negroni' }))
  })
})
