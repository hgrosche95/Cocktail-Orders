import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import cocktails from './data/cocktails'

vi.mock('./liveUpdates', () => ({ connectLiveUpdates: () => () => {} }))

const openOrder = {
  orderId: 'o1',
  name: 'Anan',
  items: [{ id: 1, name: 'Mojito', orderId: 'i1' }],
  note: '',
}

function mockFetch(openOrders) {
  const fn = vi.fn((url) => {
    const u = String(url)
    let data = []
    if (u.includes('/api/orders') && !u.includes('history')) data = openOrders
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) })
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
}

function seedLoggedIn() {
  localStorage.setItem('currentUser', 'Anan')
  localStorage.setItem('order', JSON.stringify([{ id: 1, name: 'Mojito', orderId: 'i1' }]))
  localStorage.setItem('dismissedRatingOrderId', '7')
  localStorage.setItem('barSound', 'off')
}

describe('App Abmelden', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('Abmelden ohne offene Bestellung zeigt Login und raeumt localStorage', async () => {
    const user = userEvent.setup()
    mockFetch([])
    seedLoggedIn()
    renderApp()

    await user.click(await screen.findByRole('button', { name: 'Abmelden' }))

    expect(await screen.findByLabelText('Wer kommt hoch?')).toBeInTheDocument()
    await waitFor(() => expect(localStorage.getItem('currentUser')).toBeNull())
    expect(localStorage.getItem('order')).toBeNull()
    expect(localStorage.getItem('dismissedRatingOrderId')).toBeNull()
    expect(localStorage.getItem('barSound')).toBe('off')
  })

  test('mit offener Bestellung erst Hinweis, Zurueck bleibt angemeldet', async () => {
    const user = userEvent.setup()
    mockFetch([openOrder])
    seedLoggedIn()
    renderApp()

    await screen.findByRole('button', { name: 'Abmelden' })
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Abmelden' }))

    expect(await screen.findByText(/läuft unter Anan weiter/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Zurück' }))

    expect(screen.queryByLabelText('Wer kommt hoch?')).not.toBeInTheDocument()
    expect(localStorage.getItem('currentUser')).toBe('Anan')
  })

  test('mit offener Bestellung: Ja, abmelden meldet ab ohne DELETE', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch([openOrder])
    seedLoggedIn()
    renderApp()

    await screen.findByRole('button', { name: 'Abmelden' })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Abmelden' }))
    await user.click(await screen.findByRole('button', { name: 'Ja, abmelden' }))

    expect(await screen.findByLabelText('Wer kommt hoch?')).toBeInTheDocument()
    const methods = fetchMock.mock.calls.map(([, init]) => init?.method)
    expect(methods).not.toContain('DELETE')
  })

  test('nach Abmelden neuer Name ohne Reload', async () => {
    const user = userEvent.setup()
    mockFetch([])
    seedLoggedIn()
    renderApp()

    await user.click(await screen.findByRole('button', { name: 'Abmelden' }))
    await user.type(await screen.findByLabelText('Wer kommt hoch?'), 'Anna')
    await user.click(screen.getByRole('button', { name: 'Hochfahren' }))

    expect(await screen.findByRole('button', { name: 'Abmelden' })).toBeInTheDocument()
    expect(localStorage.getItem('currentUser')).toBe('Anna')
  })

  test('leeres currentUser in localStorage startet ausgeloggt', async () => {
    mockFetch([])
    localStorage.setItem('currentUser', '   ')
    renderApp()

    expect(await screen.findByLabelText('Wer kommt hoch?')).toBeInTheDocument()
  })
})

describe('App abgelehnte Bestellung', () => {
  const mojito = cocktails.find((c) => c.name === 'Mojito')
  const message = 'Dieser Drink ist gerade nicht verfuegbar: Mojito.'

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('currentUser', 'Anan')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('shows the server error and hides the drink when the order is rejected as unavailable', async () => {
    const user = userEvent.setup()
    let unavailable = []
    const json = (status, data) =>
      Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(data) })
    vi.stubGlobal(
      'fetch',
      vi.fn((url, init) => {
        const u = String(url)
        if (u.includes('/api/orders') && init?.method === 'POST') {
          unavailable = [mojito.ingredients[0]]
          return json(409, { error: message })
        }
        if (u.includes('/api/unavailable-ingredients')) return json(200, unavailable)
        if (u.endsWith('/menu')) return json(200, cocktails)
        return json(200, [])
      })
    )
    renderApp()

    await user.click(await screen.findByRole('button', { name: 'Mojito vormerken' }))
    await user.click(await screen.findByRole('button', { name: 'Bestellung abschicken' }))

    expect(await screen.findByText(message)).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Mojito vormerken' })).not.toBeInTheDocument()
    )
  })
})

describe('App Demo-Zugang', () => {
  // Die Theke zeigt die Positionen mit Rezept an; der Server baut die Items
  // als volle Cocktail-Snapshots (server/app.js), also muss das Mock dasselbe
  // Format haben wie die echten Antworten von GET /api/orders.
  const demoOrder = {
    orderId: 'o9',
    name: 'Anna',
    items: [{ ...cocktails[0], orderId: 'i9' }],
    note: '',
    startedAt: null,
  }

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function renderAt(path) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    )
  }

  test('Demo-Zugang zeigt Theke nur lesend', async () => {
    const user = userEvent.setup()
    mockFetch([demoOrder])
    renderAt('/barkeeper')

    await user.click(await screen.findByRole('button', { name: 'Demo ansehen (nur lesen)' }))

    expect(await screen.findByText('Anna')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Erledigt/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Barkeeper-Passwort')).not.toBeInTheDocument()
  })

  test('Demo-Zugang gilt nicht für Statistik', async () => {
    const fetchMock = mockFetch([])
    sessionStorage.setItem('barkeeperDemo', '1')
    renderAt('/barkeeper/statistik')

    expect(await screen.findByLabelText('Barkeeper-Passwort')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/api/stats'))).toBe(false)
  })

  test('Demo verlassen führt zum Login', async () => {
    const user = userEvent.setup()
    mockFetch([demoOrder])
    sessionStorage.setItem('barkeeperDemo', '1')
    renderAt('/barkeeper')

    await user.click(await screen.findByRole('button', { name: 'Als Barkeeper anmelden' }))

    expect(await screen.findByLabelText('Barkeeper-Passwort')).toBeInTheDocument()
    expect(sessionStorage.getItem('barkeeperDemo')).toBeNull()
  })
})
