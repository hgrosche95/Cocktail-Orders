import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  test('calls onLogin with the entered name on submit', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    await user.type(screen.getByLabelText('Dein Name:'), 'Max')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(onLogin).toHaveBeenCalledWith('Max')
  })

  test('does not call onLogin when the name is empty', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(onLogin).not.toHaveBeenCalled()
  })
})
