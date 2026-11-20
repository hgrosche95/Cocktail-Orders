import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGuestData } from './useGuestData'

const entry = { orderId: 'h1', name: 'Anna', items: [{ id: 1, name: 'Mojito', orderId: 'x' }], note: '' }

function jsonResponse(data) {
  return { ok: true, status: 200, json: () => Promise.resolve(data) }
}

describe('useGuestData Abmelden', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('leert Historie, Ratings und Empfehlungen beim Wechsel auf leeren Namen', async () => {
    fetch.mockImplementation((url) => {
      if (String(url).includes('/orders/history')) return Promise.resolve(jsonResponse([entry]))
      if (String(url).includes('/ratings')) {
        return Promise.resolve(jsonResponse([{ cocktailId: 1, rating: 5 }]))
      }
      return Promise.resolve(jsonResponse([{ id: 2, name: 'Negroni' }]))
    })
    const { result, rerender } = renderHook(({ user }) => useGuestData(user, () => {}), {
      initialProps: { user: 'Anna' },
    })
    await waitFor(() => expect(result.current.history.length).toBe(1))
    await waitFor(() => expect(result.current.recommendations.length).toBe(1))

    rerender({ user: '' })

    await waitFor(() => {
      expect(result.current.history).toEqual([])
      expect(result.current.ratings).toEqual({})
      expect(result.current.recommendations).toEqual([])
    })
  })

  test('uebernimmt keine verspaetete Antwort nach dem Abmelden', async () => {
    let resolveHistory
    fetch.mockImplementation((url) => {
      if (String(url).includes('/orders/history')) {
        return new Promise((resolve) => {
          resolveHistory = resolve
        })
      }
      return Promise.resolve(jsonResponse([]))
    })
    const { result, rerender } = renderHook(({ user }) => useGuestData(user, () => {}), {
      initialProps: { user: 'Anna' },
    })
    await waitFor(() => expect(resolveHistory).toBeDefined())

    rerender({ user: '' })
    await act(async () => {
      resolveHistory(jsonResponse([entry]))
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(result.current.history).toEqual([])
  })

  test('laedt fuer leeren Namen nichts', () => {
    renderHook(() => useGuestData('', () => {}))

    expect(fetch).toHaveBeenCalledTimes(0)
  })
})
