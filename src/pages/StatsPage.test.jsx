import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import StatsPage from './StatsPage'

const stats = {
  servedDrinks: 7,
  guests: 3,
  openOrders: 1,
  averageRating: 4.5,
  ratingCount: 2,
  topCocktails: [
    { cocktailId: 1, name: 'Cable Car', count: 4 },
    { cocktailId: 2, name: 'Mojito', count: 3 },
  ],
  topRated: [{ cocktailId: 1, name: 'Cable Car', averageRating: 4.5, ratingCount: 2 }],
  ingredientUsage: [
    { ingredient: 'Rum', totalCl: 33, drinks: 7 },
    { ingredient: 'Zitronensaft', totalCl: 8.5, drinks: 4 },
    { ingredient: 'Minze', totalCl: null, drinks: 3 },
  ],
}

function renderPage(loadStats, liveVersion = 0) {
  return render(
    <MemoryRouter>
      <StatsPage loadStats={loadStats} liveVersion={liveVersion} />
    </MemoryRouter>
  )
}

describe('StatsPage', () => {
  test('shows tiles, rankings and ingredient usage', async () => {
    renderPage(vi.fn().mockResolvedValue(stats))

    const served = await screen.findByText('Serviert')
    expect(served.nextSibling).toHaveTextContent('7')
    expect(screen.getByText('Ø Bewertung').nextSibling).toHaveTextContent('4,5 ★')

    const top = screen.getByRole('heading', { name: 'Meistbestellt' }).parentElement
    expect(within(top).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Cable Car4×',
      'Mojito3×',
    ])
    expect(screen.getByText('8,5 cl')).toBeInTheDocument()
    expect(screen.getByText(/Ohne Mengenangabe: Minze \(3 Drinks\)/)).toBeInTheDocument()
  })

  test('loads the last 24 hours first and everything on request', async () => {
    const loadStats = vi.fn().mockResolvedValue(stats)
    renderPage(loadStats)
    await screen.findByText('Serviert')

    const since = new Date(loadStats.mock.calls[0][0]).getTime()
    expect(Date.now() - since).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000)
    expect(Date.now() - since).toBeLessThan(24 * 60 * 60 * 1000 + 60 * 1000)

    await userEvent.click(screen.getByRole('button', { name: 'Gesamt' }))

    expect(loadStats).toHaveBeenLastCalledWith(null)
  })

  test('reloads on live changes', async () => {
    const loadStats = vi.fn().mockResolvedValue(stats)
    const { rerender } = renderPage(loadStats, 0)
    await screen.findByText('Serviert')

    rerender(
      <MemoryRouter>
        <StatsPage loadStats={loadStats} liveVersion={1} />
      </MemoryRouter>
    )

    expect(loadStats).toHaveBeenCalledTimes(2)
  })

  test('says so when there is nothing yet', async () => {
    renderPage(
      vi.fn().mockResolvedValue({
        ...stats,
        servedDrinks: 0,
        averageRating: null,
        topCocktails: [],
        topRated: [],
        ingredientUsage: [],
      })
    )

    expect(await screen.findByText('Noch nichts serviert.')).toBeInTheDocument()
    expect(screen.getByText('Ø Bewertung').nextSibling).toHaveTextContent('–')
  })

  test('shows an error when loading fails', async () => {
    renderPage(vi.fn().mockResolvedValue(null))

    expect(await screen.findByText('Statistik konnte nicht geladen werden.')).toBeInTheDocument()
  })
})
