import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CocktailList from './CocktailList'

// Die Karten verlinken auf die Detailansicht und brauchen deshalb einen Router.
const renderWithRouter = (ui) => render(ui, { wrapper: MemoryRouter })

describe('CocktailList', () => {
  test('shows cocktails when no ingredients are unavailable', () => {
    renderWithRouter(<CocktailList onAddToOrder={() => {}} unavailableIngredients={[]} />)

    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText('Negroni')).toBeInTheDocument()
  })

  test('hides cocktails that need an unavailable ingredient', () => {
    renderWithRouter(<CocktailList onAddToOrder={() => {}} unavailableIngredients={['Rum']} />)

    // Mojito braucht Rum und sollte verschwinden ...
    expect(screen.queryByText('Mojito')).not.toBeInTheDocument()
    // ... Negroni braucht keinen Rum und sollte weiterhin da sein
    expect(screen.getByText('Negroni')).toBeInTheDocument()
  })
})
