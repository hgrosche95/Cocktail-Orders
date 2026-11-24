import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useWish } from './useWish'

const negroni = { id: 1, name: 'Negroni', ingredients: ['Gin', 'Campari', 'Wermut'] }
const americano = { id: 2, name: 'Americano', ingredients: ['Campari', 'Wermut', 'Soda'] }
const mojito = { id: 3, name: 'Mojito', ingredients: ['Rum', 'Minze'] }
const cocktails = [negroni, americano, mojito]

function response(status, data) {
  return { ok: status < 400, status, json: () => Promise.resolve(data) }
}

function setup(unavailableIngredients = []) {
  const onSingleMatch = vi.fn()
  const hook = renderHook(() => useWish({ cocktails, unavailableIngredients, onSingleMatch }))
  return { ...hook, onSingleMatch }
}

async function wish(result, text = 'etwas Bitteres, ohne Eis') {
  act(() => result.current.submitWish(text))
  await waitFor(() => expect(result.current.isTextRecommending).toBe(false))
}

describe('useWish', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  test('meldet "no-match", wenn nichts passt', async () => {
    fetch.mockResolvedValue(response(200, { cocktailIds: [], note: null }))
    const { result } = setup()

    await wish(result)

    expect(result.current.wishFeedback).toBe('no-match')
    expect(result.current.textRecommendations).toEqual([])
  })

  test('meldet "no-match", wenn alle Treffer ausverkauft sind', async () => {
    fetch.mockResolvedValue(response(200, { cocktailIds: [3], note: null }))
    const { result, onSingleMatch } = setup(['Rum'])

    await wish(result)

    expect(result.current.wishFeedback).toBe('no-match')
    expect(onSingleMatch).not.toHaveBeenCalled()
  })

  test('meldet "failed" bei einem Serverfehler', async () => {
    fetch.mockResolvedValue(response(502, { error: 'Empfehlung derzeit nicht verfügbar' }))
    const { result } = setup()

    await wish(result)

    expect(result.current.wishFeedback).toBe('failed')
    expect(result.current.isWishFeatureDisabled).toBe(false)
  })

  test('meldet "failed", wenn der Server nicht erreichbar ist', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = setup()

    await wish(result)

    expect(result.current.wishFeedback).toBe('failed')
  })

  test('ein neuer Wunsch raeumt die alte Meldung weg', async () => {
    fetch.mockResolvedValueOnce(response(200, { cocktailIds: [], note: null }))
    fetch.mockResolvedValueOnce(response(200, { cocktailIds: [1, 2], note: null }))
    const { result } = setup()

    await wish(result)
    await wish(result)

    expect(result.current.wishFeedback).toBe(null)
    expect(result.current.textRecommendations).toHaveLength(2)
  })

  test('behaelt den Servierwunsch bei mehreren Treffern fuer den gewaehlten Drink', async () => {
    fetch.mockResolvedValue(response(200, { cocktailIds: [1, 2], note: 'ohne Eis' }))
    const { result, onSingleMatch } = setup()

    await wish(result)
    expect(result.current.wishNote).toBe('')

    act(() => result.current.pickWishMatch(americano))

    expect(onSingleMatch).toHaveBeenCalledWith(americano)
    expect(result.current.wishNote).toBe('ohne Eis')
  })

  test('uebernimmt einen einzelnen Treffer samt Servierwunsch direkt', async () => {
    fetch.mockResolvedValue(response(200, { cocktailIds: [1], note: 'ohne Eis' }))
    const { result, onSingleMatch } = setup()

    await wish(result)

    expect(onSingleMatch).toHaveBeenCalledWith(negroni)
    expect(result.current.wishNote).toBe('ohne Eis')
    expect(result.current.wishFeedback).toBe(null)
  })
})
