import { describe, test, expect } from 'vitest'
import { computeStats } from './stats.js'

// Kleine Test-Karte statt der echten, damit die erwarteten Mengen
// nachvollziehbar bleiben.
const menu = new Map([
  [1, { id: 1, name: 'Gin Tonic', recipe: { ingredients: [
    { name: 'Gin', amountCl: 4 },
    { name: 'Tonic', amountCl: 12 },
  ] } }],
  [2, { id: 2, name: 'Mojito', recipe: { ingredients: [
    { name: 'Rum', amountCl: 5 },
    { name: 'Minze', note: 'ein Zweig' },
  ] } }],
  [3, { id: 3, name: 'Negroni', recipe: { ingredients: [
    { name: 'Gin', amountCl: 3 },
    { name: 'Campari', amountCl: 3 },
  ] } }],
])
const findCocktail = (id) => menu.get(id)

function order(name, ...ids) {
  return { name, items: ids.map((id) => ({ id })) }
}

describe('computeStats', () => {
  test('sums ingredient amounts from the menu recipe, largest first', () => {
    const stats = computeStats({
      servedOrders: [order('Max', 1), order('Anna', 1), order('Lea', 3)],
      ratings: [],
      findCocktail,
    })

    expect(stats.ingredientUsage).toEqual([
      { ingredient: 'Tonic', totalCl: 24, drinks: 2 },
      { ingredient: 'Gin', totalCl: 11, drinks: 3 },
      { ingredient: 'Campari', totalCl: 3, drinks: 1 },
    ])
  })

  test('lists ingredients without an amount after those with one', () => {
    const stats = computeStats({ servedOrders: [order('Max', 2)], ratings: [], findCocktail })

    expect(stats.ingredientUsage).toEqual([
      { ingredient: 'Rum', totalCl: 5, drinks: 1 },
      { ingredient: 'Minze', totalCl: null, drinks: 1 },
    ])
  })

  test('ranks cocktails by count, ties alphabetically', () => {
    const stats = computeStats({
      servedOrders: [order('Max', 3), order('Anna', 1), order('Lea', 2), order('Tom', 3)],
      ratings: [],
      findCocktail,
    })

    expect(stats.topCocktails.map((c) => [c.name, c.count])).toEqual([
      ['Negroni', 2],
      ['Gin Tonic', 1],
      ['Mojito', 1],
    ])
    expect(stats.guests).toBe(4)
    expect(stats.servedDrinks).toBe(4)
  })

  test('ranks by average rating, more ratings first on a tie', () => {
    const stats = computeStats({
      servedOrders: [],
      ratings: [
        { cocktailId: 1, rating: 5 },
        { cocktailId: 2, rating: 5 },
        { cocktailId: 2, rating: 5 },
        { cocktailId: 3, rating: 2 },
        { cocktailId: 3, rating: 3 },
      ],
      findCocktail,
    })

    expect(stats.topRated.map((c) => [c.name, c.averageRating, c.ratingCount])).toEqual([
      ['Mojito', 5, 2],
      ['Gin Tonic', 5, 1],
      ['Negroni', 2.5, 2],
    ])
    expect(stats.averageRating).toBe(4)
    expect(stats.ratingCount).toBe(5)
  })

  test('skips cocktails that are no longer on the menu', () => {
    const stats = computeStats({
      servedOrders: [order('Max', 99, 1)],
      ratings: [{ cocktailId: 99, rating: 1 }],
      findCocktail,
    })

    expect(stats.servedDrinks).toBe(1)
    expect(stats.topRated).toEqual([])
    expect(stats.averageRating).toBeNull()
  })
})
