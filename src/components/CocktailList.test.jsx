import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CocktailList from './CocktailList'

describe('CocktailList', () => {
  test('shows cocktails when no ingredients are unavailable', () => {
    render(<CocktailList onAddToOrder={() => {}} unavailableIngredients={[]} />)

    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText('Negroni')).toBeInTheDocument()
  })

  test('hides cocktails that need an unavailable ingredient', () => {
    render(<CocktailList onAddToOrder={() => {}} unavailableIngredients={['Rum']} />)

    // Mojito braucht Rum und sollte verschwinden ...
    expect(screen.queryByText('Mojito')).not.toBeInTheDocument()
    // ... Negroni braucht keinen Rum und sollte weiterhin da sein
    expect(screen.getByText('Negroni')).toBeInTheDocument()
  })
})
