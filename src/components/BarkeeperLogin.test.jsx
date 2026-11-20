import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BarkeeperLogin from './BarkeeperLogin'

describe('BarkeeperLogin Demo-Einstieg', () => {
  test('zeigt Demo-Button nur mit onStartDemo', () => {
    const { unmount } = render(<BarkeeperLogin onLogin={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Demo ansehen/ })).not.toBeInTheDocument()
    unmount()

    render(<BarkeeperLogin onLogin={vi.fn()} onStartDemo={vi.fn()} />)
    expect(screen.getAllByRole('button', { name: /Demo ansehen/ })).toHaveLength(1)
  })

  test('Demo-Button ruft onStartDemo, nicht onLogin', async () => {
    const onLogin = vi.fn()
    const onStartDemo = vi.fn()
    render(<BarkeeperLogin onLogin={onLogin} onStartDemo={onStartDemo} />)

    await userEvent.click(screen.getByRole('button', { name: /Demo ansehen/ }))

    expect(onStartDemo).toHaveBeenCalledTimes(1)
    expect(onLogin).not.toHaveBeenCalled()
  })
})
