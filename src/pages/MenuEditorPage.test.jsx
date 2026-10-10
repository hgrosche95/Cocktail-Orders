import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MenuEditorPage from './MenuEditorPage'
import { MenuContext } from '../data/menu'
import baseCocktails from '../data/cocktails'

const customDrink = {
  id: 1001,
  name: 'Rooftop Tiki',
  category: 'Süß & Fruchtig',
  ingredients: ['Rum', 'Ananassaft'],
  movie: '',
  recipe: { ingredients: [{ name: 'Rum', amountCl: 5 }, { name: 'Ananassaft' }], ice: '', servedWithIceCubes: false },
  custom: true,
}

function renderPage({ onAdd = vi.fn().mockResolvedValue(null), onRemove = vi.fn(), menu = baseCocktails } = {}) {
  render(
    <MenuContext.Provider value={menu}>
      <MemoryRouter>
        <MenuEditorPage onAdd={onAdd} onRemove={onRemove} />
      </MemoryRouter>
    </MenuContext.Provider>
  )
  return { onAdd, onRemove }
}

describe('MenuEditorPage', () => {
  test('sends a new drink with parsed amounts and resets the form', async () => {
    const { onAdd } = renderPage()

    await userEvent.type(screen.getByLabelText('Name'), 'Rooftop Tiki')
    await userEvent.selectOptions(screen.getByLabelText('Kategorie'), 'Süß & Fruchtig')
    await userEvent.type(screen.getByLabelText('Zutat 1'), 'Rum')
    await userEvent.type(screen.getByLabelText('Menge in cl für Zutat 1'), '4,5')
    await userEvent.click(screen.getByRole('button', { name: '+ Zutat' }))
    await userEvent.type(screen.getByLabelText('Zutat 2'), 'Minze')
    await userEvent.type(screen.getByLabelText('Hinweis für Zutat 2'), 'zum Garnieren')
    await userEvent.click(screen.getByLabelText('Mit Eiswürfeln im Glas serviert'))
    await userEvent.click(screen.getByRole('button', { name: 'Auf die Karte setzen' }))

    expect(onAdd).toHaveBeenCalledWith({
      name: 'Rooftop Tiki',
      category: 'Süß & Fruchtig',
      movie: '',
      description: '',
      recipe: {
        ingredients: [{ name: 'Rum', amountCl: 4.5 }, { name: 'Minze', note: 'zum Garnieren' }],
        ice: '',
        servedWithIceCubes: true,
      },
    })
    expect(await screen.findByRole('status')).toHaveTextContent('„Rooftop Tiki“ steht jetzt auf der Karte.')
    expect(screen.getByLabelText('Name')).toHaveValue('')
  })

  test('checks name, ingredients and amounts before sending', async () => {
    const { onAdd } = renderPage()
    const submit = screen.getByRole('button', { name: 'Auf die Karte setzen' })

    await userEvent.click(submit)
    expect(screen.getByText('Der Drink braucht einen Namen.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Name'), 'Test')
    await userEvent.click(submit)
    expect(screen.getByText('Mindestens eine Zutat angeben.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Zutat 1'), 'Rum')
    await userEvent.type(screen.getByLabelText('Menge in cl für Zutat 1'), '80')
    await userEvent.click(submit)
    expect(screen.getByText(/Menge für Rum/)).toBeInTheDocument()

    expect(onAdd).not.toHaveBeenCalled()
  })

  test('shows the error from the server and keeps the input', async () => {
    renderPage({ onAdd: vi.fn().mockResolvedValue('Einen Drink mit diesem Namen gibt es schon.') })

    await userEvent.type(screen.getByLabelText('Name'), 'Mojito')
    await userEvent.type(screen.getByLabelText('Zutat 1'), 'Rum')
    await userEvent.click(screen.getByRole('button', { name: 'Auf die Karte setzen' }))

    expect(await screen.findByText('Einen Drink mit diesem Namen gibt es schon.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Mojito')
  })

  test('lists only custom drinks and removes one after confirming', async () => {
    const { onRemove } = renderPage({ menu: [...baseCocktails, customDrink] })

    expect(screen.getByRole('link', { name: 'Rooftop Tiki' })).toHaveAttribute('href', '/drink/1001')
    expect(screen.queryByRole('link', { name: baseCocktails[0].name })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Rooftop Tiki entfernen' }))
    expect(onRemove).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Ja, entfernen' }))

    expect(onRemove).toHaveBeenCalledWith(1001)
  })

  test('says so when there are no custom drinks yet', () => {
    renderPage()

    expect(screen.getByText(/Noch keine eigenen Drinks/)).toBeInTheDocument()
  })
})
