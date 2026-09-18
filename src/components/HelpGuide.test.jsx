import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HelpGuide from './HelpGuide'

describe('HelpGuide', () => {
  test('the guide is hidden until the help button is clicked', async () => {
    const user = userEvent.setup()
    render(<HelpGuide />)

    expect(screen.queryByText("So funktioniert's")).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hilfe anzeigen' }))

    expect(screen.getByText("So funktioniert's")).toBeInTheDocument()
    expect(screen.getByText(/einen Negroni, aber ohne Eis/)).toBeInTheDocument()
  })

  test('closes when the close button is clicked', async () => {
    const user = userEvent.setup()
    render(<HelpGuide />)

    await user.click(screen.getByRole('button', { name: 'Hilfe anzeigen' }))
    await user.click(screen.getByRole('button', { name: 'Schließen' }))

    expect(screen.queryByText("So funktioniert's")).not.toBeInTheDocument()
  })

  test('closes when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<HelpGuide />)

    await user.click(screen.getByRole('button', { name: 'Hilfe anzeigen' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByText("So funktioniert's")).not.toBeInTheDocument()
  })

  test('closes when clicking the overlay, but not when clicking inside the guide', async () => {
    const user = userEvent.setup()
    const { container } = render(<HelpGuide />)

    await user.click(screen.getByRole('button', { name: 'Hilfe anzeigen' }))
    await user.click(screen.getByText("So funktioniert's"))
    expect(screen.getByText("So funktioniert's")).toBeInTheDocument()

    await user.click(container.querySelector('.modal-overlay'))
    expect(screen.queryByText("So funktioniert's")).not.toBeInTheDocument()
  })
})
