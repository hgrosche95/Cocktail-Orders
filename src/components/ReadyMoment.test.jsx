import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReadyMoment from './ReadyMoment'

const item = { orderId: 'a', name: 'Negroni', category: 'Aperitivos' }

describe('ReadyMoment', () => {
  test('names the drink and where to pick it up', () => {
    render(<ReadyMoment item={item} onClose={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Negroni ist fertig' })).toBeInTheDocument()
    expect(screen.getByText('Steht für dich an der Theke.')).toBeInTheDocument()
  })

  test('can be closed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ReadyMoment item={item} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Alles klar' }))

    expect(onClose).toHaveBeenCalled()
  })
})
