import { describe, test, expect } from 'vitest'
import { parseRecommendation } from './groq.js'

describe('parseRecommendation', () => {
  const cocktails = [
    { id: 1, name: 'Cable Car' },
    { id: 16, name: 'Negroni' },
    { id: 22, name: 'Mojito' },
  ]

  test('returns the ids from a well-formed response', () => {
    const raw = JSON.stringify({ cocktailIds: [16, 1], note: null })

    expect(parseRecommendation(raw, cocktails)).toEqual({ cocktailIds: [16, 1], note: null })
  })

  test('returns empty ids and no note for malformed JSON', () => {
    expect(parseRecommendation('not json', cocktails)).toEqual({ cocktailIds: [], note: null })
  })

  test('returns empty ids when cocktailIds is missing', () => {
    expect(parseRecommendation('{}', cocktails)).toEqual({ cocktailIds: [], note: null })
  })

  test('drops ids that are not on the menu (hallucinated by the model)', () => {
    const raw = JSON.stringify({ cocktailIds: [16, 999] })

    expect(parseRecommendation(raw, cocktails).cocktailIds).toEqual([16])
  })

  test('caps the result at 5 entries', () => {
    const manyCocktails = Array.from({ length: 8 }, (_, i) => ({ id: i, name: `Cocktail ${i}` }))
    const raw = JSON.stringify({ cocktailIds: manyCocktails.map((c) => c.id) })

    expect(parseRecommendation(raw, manyCocktails).cocktailIds).toHaveLength(5)
  })

  test('passes through a real note', () => {
    const raw = JSON.stringify({ cocktailIds: [1], note: 'ohne Eis' })

    expect(parseRecommendation(raw, cocktails).note).toBe('ohne Eis')
  })

  test('treats a blank note as no note', () => {
    const raw = JSON.stringify({ cocktailIds: [1], note: '   ' })

    expect(parseRecommendation(raw, cocktails).note).toBeNull()
  })

  test('ignores a non-string note', () => {
    const raw = JSON.stringify({ cocktailIds: [1], note: 42 })

    expect(parseRecommendation(raw, cocktails).note).toBeNull()
  })
})
