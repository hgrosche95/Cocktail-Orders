import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BarkeeperPage from './BarkeeperPage'
import cocktails from '../data/cocktails'

const item = { ...cocktails[0], orderId: 'i1' }
const waiting = { orderId: 'o1', name: 'Anna', items: [item], note: '', startedAt: null }
const mixing = { orderId: 'o2', name: 'Ben', items: [item], note: '', startedAt: '2026-10-12T20:00:00Z' }

function renderPage(props = {}) {
  const handlers = {
    onMarkAsDone: vi.fn(),
    onStartOrder: vi.fn(),
    onToggleSound: vi.fn(),
    onMarkIngredientUnavailable: vi.fn(),
    onMarkIngredientAvailable: vi.fn(),
    onReopenOrder: vi.fn(),
  }
  render(
    <MemoryRouter>
      <BarkeeperPage
        openOrders={[waiting, mixing]}
        unavailableIngredients={[]}
        recentlyCompleted={[]}
        isSoundOn
        {...handlers}
        {...props}
      />
    </MemoryRouter>
  )
  return handlers
}

describe('BarkeeperPage', () => {
  test('starts a waiting order; a started one shows its status instead', async () => {
    const { onStartOrder } = renderPage()
    const [annaCard, benCard] = screen.getAllByRole('listitem').filter((li) =>
      li.classList.contains('barkeeper-order')
    )

    await userEvent.click(within(annaCard).getByRole('button', { name: 'Anfangen' }))
    expect(onStartOrder).toHaveBeenCalledWith('o1')

    expect(within(benCard).getByText('In Arbeit')).toBeInTheDocument()
    expect(within(benCard).queryByRole('button', { name: 'Anfangen' })).not.toBeInTheDocument()
    expect(within(benCard).getByRole('button', { name: 'Erledigt' })).toBeInTheDocument()
  })

  test('toggles the sound', async () => {
    const { onToggleSound } = renderPage({ isSoundOn: false })

    const toggle = screen.getByRole('button', { name: /Ton aus/ })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)

    expect(onToggleSound).toHaveBeenCalled()
  })

  test('readOnly zeigt Bestellung ohne Aktionen', () => {
    renderPage({ readOnly: true, openOrders: [waiting] })

    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.getByText(item.name)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Anfangen/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Erledigt/ })).not.toBeInTheDocument()
  })

  test('readOnly sperrt Zutaten-Chips', async () => {
    const { onMarkIngredientAvailable } = renderPage({
      readOnly: true,
      unavailableIngredients: ['Minze'],
    })

    const chips = Array.from(document.querySelectorAll('button.ingredient-chip'))
    expect(chips.length).toBeGreaterThan(0)
    for (const chip of chips) {
      expect(chip).toBeDisabled()
      await userEvent.click(chip)
    }
    expect(onMarkIngredientAvailable).toHaveBeenCalledTimes(0)
  })

  test('readOnly blendet Karte/Statistik-Links aus', () => {
    renderPage({ readOnly: true })

    const hrefs = screen.queryAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).not.toContain('/barkeeper/statistik')
    expect(hrefs).not.toContain('/barkeeper/karte')
  })

  test('Demo-Hinweis ruft onExitDemo', async () => {
    const onExitDemo = vi.fn()
    renderPage({ readOnly: true, onExitDemo })

    expect(screen.getByRole('status')).toHaveTextContent(/Demo – nur Lesen/)
    await userEvent.click(screen.getByRole('button', { name: 'Als Barkeeper anmelden' }))

    expect(onExitDemo).toHaveBeenCalledTimes(1)
  })

  const doneOrder = {
    orderId: 42,
    name: 'Anna',
    items: [item],
    note: '',
    completedAt: new Date().toISOString(),
  }

  test('Rückgängig ruft onReopenOrder mit der orderId', async () => {
    const { onReopenOrder } = renderPage({ recentlyCompleted: [doneOrder] })

    await userEvent.click(screen.getByRole('button', { name: 'Rückgängig' }))

    expect(onReopenOrder).toHaveBeenCalledWith(42)
  })

  test('kein Rückgängig in der Demo-Theke', () => {
    renderPage({ readOnly: true, recentlyCompleted: [doneOrder] })

    expect(screen.queryByRole('button', { name: 'Rückgängig' })).not.toBeInTheDocument()
  })

  test('kein Abschnitt ohne erledigte Bestellungen', () => {
    renderPage({ recentlyCompleted: [] })

    expect(screen.queryByText('Gerade erledigt')).not.toBeInTheDocument()
  })

  test('ohne readOnly unverändert', () => {
    renderPage()

    expect(screen.getByRole('button', { name: 'Anfangen' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Erledigt' }).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Demo – nur Lesen/)).not.toBeInTheDocument()
  })
})
