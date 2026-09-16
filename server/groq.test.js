import { describe, test, expect } from 'vitest'
import { parseRecommendation } from './groq.js'

describe('parseRecommendation', () => {
  const cocktails = [
    { id: 1, name: 'Cable Car' },
    { id: 16, name: 'Negroni' },
    { id: 22, name: 'Mojito' },
  ]

  test('returns the ids from a well-formed response', () => {
    const raw = JSON.stringify({ cocktailIds: [16, 1] })

    expect(parseRecommendation(raw, cocktails)).toEqual([16, 1])
  })

  test('returns an empty array for malformed JSON', () => {
    expect(parseRecommendation('not json', cocktails)).toEqual([])
  })

  test('returns an empty array when cocktailIds is missing', () => {
    expect(parseRecommendation('{}', cocktails)).toEqual([])
  })

  test('drops ids that are not on the menu (hallucinated by the model)', () => {
    const raw = JSON.stringify({ cocktailIds: [16, 999] })

    expect(parseRecommendation(raw, cocktails)).toEqual([16])
  })

  test('caps the result at 5 entries', () => {
    const manyCocktails = Array.from({ length: 8 }, (_, i) => ({ id: i, name: `Cocktail ${i}` }))
    const raw = JSON.stringify({ cocktailIds: manyCocktails.map((c) => c.id) })

    expect(parseRecommendation(raw, manyCocktails)).toHaveLength(5)
  })
})
