import { describe, test, expect } from 'vitest'
import { recommendCocktails } from './recommendations.js'

describe('recommendCocktails', () => {
  test('returns nothing when there are no ratings at all', () => {
    const result = recommendCocktails({ ratings: [], guestName: 'Max' })
    expect(result).toEqual([])
  })

  test('returns nothing for a guest who has not rated anything yet (cold start)', () => {
    const ratings = [
      { guestName: 'Anna', cocktailId: 1, rating: 5 },
      { guestName: 'Anna', cocktailId: 2, rating: 4 },
    ]
    const result = recommendCocktails({ ratings, guestName: 'Max' })
    expect(result).toEqual([])
  })

  test('recommends a cocktail liked by a guest with the same taste', () => {
    const ratings = [
      { guestName: 'Max', cocktailId: 1, rating: 5 },
      { guestName: 'Anna', cocktailId: 1, rating: 5 },
      { guestName: 'Anna', cocktailId: 2, rating: 4 },
    ]
    const result = recommendCocktails({ ratings, guestName: 'Max' })
    expect(result).toEqual([{ cocktailId: 2, predictedRating: 4 }])
  })

  test('never recommends a cocktail the guest already rated', () => {
    const ratings = [
      { guestName: 'Max', cocktailId: 1, rating: 5 },
      { guestName: 'Max', cocktailId: 2, rating: 3 },
      { guestName: 'Anna', cocktailId: 1, rating: 5 },
      { guestName: 'Anna', cocktailId: 2, rating: 5 },
    ]
    const result = recommendCocktails({ ratings, guestName: 'Max' })
    expect(result).toEqual([])
  })

  test('weighs recommendations from more similar guests higher', () => {
    const ratings = [
      // Max loves cocktail 1, dislikes cocktail 2.
      { guestName: 'Max', cocktailId: 1, rating: 5 },
      { guestName: 'Max', cocktailId: 2, rating: 1 },
      // Anna has the same taste pattern as Max on the shared cocktails,
      // and rates the candidate cocktail 3 highly.
      { guestName: 'Anna', cocktailId: 1, rating: 5 },
      { guestName: 'Anna', cocktailId: 2, rating: 1 },
      { guestName: 'Anna', cocktailId: 3, rating: 5 },
      // Ben has the opposite taste pattern from Max on the shared
      // cocktails (less similar), and rates cocktail 3 low.
      { guestName: 'Ben', cocktailId: 1, rating: 1 },
      { guestName: 'Ben', cocktailId: 2, rating: 5 },
      { guestName: 'Ben', cocktailId: 3, rating: 1 },
    ]
    const result = recommendCocktails({ ratings, guestName: 'Max' })
    expect(result).toHaveLength(1)
    expect(result[0].cocktailId).toBe(3)
    // Predicted rating should lean towards Anna's 5 (more similar to Max)
    // rather than an unweighted average of Anna's 5 and Ben's 1, which
    // would be exactly 3.
    expect(result[0].predictedRating).toBeGreaterThan(3)
  })

  test('ignores guests with no overlap in rated cocktails', () => {
    const ratings = [
      { guestName: 'Max', cocktailId: 1, rating: 5 },
      { guestName: 'Anna', cocktailId: 2, rating: 5 },
      { guestName: 'Anna', cocktailId: 3, rating: 5 },
    ]
    const result = recommendCocktails({ ratings, guestName: 'Max' })
    expect(result).toEqual([])
  })

  test('respects the limit parameter', () => {
    const ratings = [
      { guestName: 'Max', cocktailId: 1, rating: 5 },
      { guestName: 'Anna', cocktailId: 1, rating: 5 },
      { guestName: 'Anna', cocktailId: 2, rating: 5 },
      { guestName: 'Anna', cocktailId: 3, rating: 4 },
      { guestName: 'Anna', cocktailId: 4, rating: 3 },
    ]
    const result = recommendCocktails({ ratings, guestName: 'Max', limit: 2 })
    expect(result).toHaveLength(2)
  })
})
