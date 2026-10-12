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
  }
  render(
    <MemoryRouter>
      <BarkeeperPage
        openOrders={[waiting, mixing]}
        unavailableIngredients={[]}
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
})
