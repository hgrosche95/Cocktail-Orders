import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WaitingPanel from './WaitingPanel'

const order = {
  orderId: 'o1',
  name: 'Helena',
  items: [{ orderId: 'i1', name: 'Aperol Spritz' }],
  note: 'Mit Orangenscheibe',
}

describe('WaitingPanel', () => {
  test('shows the position, the drink and the note', () => {
    render(<WaitingPanel order={order} position={3} queueLength={4} />)

    expect(screen.getByText('#3')).toBeInTheDocument()
    expect(screen.getByText('Aperol Spritz')).toBeInTheDocument()
    expect(screen.getByText('Noch 2 Bestellungen vor dir.')).toBeInTheDocument()
    expect(screen.getByText(/Mit Orangenscheibe/)).toBeInTheDocument()
  })

  test('tells the guest when they are next', () => {
    render(<WaitingPanel order={{ ...order, note: '' }} position={1} queueLength={1} />)

    expect(screen.getByText(/als Nächstes dran/)).toBeInTheDocument()
    expect(screen.getByText('Du bist dran')).toBeInTheDocument()
  })
})
