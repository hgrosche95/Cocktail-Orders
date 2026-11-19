import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  test('calls onLogin with the entered name on submit', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    await user.type(screen.getByLabelText('Wer kommt hoch?'), 'Max')
    await user.click(screen.getByRole('button', { name: 'Hochfahren' }))

    expect(onLogin).toHaveBeenCalledWith('Max')
  })

  test('does not call onLogin when the name is empty', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    await user.click(screen.getByRole('button', { name: 'Hochfahren' }))

    expect(onLogin).not.toHaveBeenCalled()
  })

  test('trimmt Leerzeichen am Ende (Handy-Wortvorschlag)', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    await user.type(screen.getByLabelText('Wer kommt hoch?'), 'Testgast ')
    await user.click(screen.getByRole('button', { name: 'Hochfahren' }))

    expect(onLogin).toHaveBeenCalledTimes(1)
    expect(onLogin).toHaveBeenCalledWith('Testgast')
  })

  test('trimmt Leerzeichen am Anfang und Ende', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    await user.type(screen.getByLabelText('Wer kommt hoch?'), '  Max  ')
    await user.click(screen.getByRole('button', { name: 'Hochfahren' }))

    expect(onLogin).toHaveBeenCalledWith('Max')
  })

  test('laesst innere Leerzeichen stehen', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    await user.type(screen.getByLabelText('Wer kommt hoch?'), 'Anna Lena ')
    await user.click(screen.getByRole('button', { name: 'Hochfahren' }))

    expect(onLogin).toHaveBeenCalledWith('Anna Lena')
  })

  test('nur Leerzeichen loggt nicht ein', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    await user.type(screen.getByLabelText('Wer kommt hoch?'), '   ')
    await user.click(screen.getByRole('button', { name: 'Hochfahren' }))

    expect(onLogin).not.toHaveBeenCalled()
  })
})
