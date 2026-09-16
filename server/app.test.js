import { describe, test, expect, beforeEach, afterAll, vi } from 'vitest'
import request from 'supertest'
import { prisma } from './prisma.js'
import { createApp } from './app.js'

function buildTestApp(overrides = {}) {
  return createApp({
    prisma,
    barkeeperPassword: 'test-password',
    ...overrides,
  })
}

beforeEach(async () => {
  await prisma.order.deleteMany()
  await prisma.unavailableIngredient.deleteMany()
  await prisma.rating.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('GET /api/ping', () => {
  test('responds with status ok', async () => {
    const app = buildTestApp()

    const response = await request(app).get('/api/ping')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('POST /api/barkeeper-login', () => {
  test('succeeds with the correct password', async () => {
    const app = buildTestApp()

    const response = await request(app)
      .post('/api/barkeeper-login')
      .send({ password: 'test-password' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ success: true })
  })

  test('fails with the wrong password', async () => {
    const app = buildTestApp()

    const response = await request(app)
      .post('/api/barkeeper-login')
      .send({ password: 'wrong' })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ success: false })
  })

  test('fails when no barkeeper password is configured', async () => {
    const app = buildTestApp({ barkeeperPassword: undefined })

    const response = await request(app)
      .post('/api/barkeeper-login')
      .send({ password: undefined })

    expect(response.status).toBe(401)
  })
})

describe('orders', () => {
  let app

  beforeEach(() => {
    app = buildTestApp()
  })

  test('starts with an empty order list', async () => {
    const response = await request(app).get('/api/orders')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test('creates an order and lists it afterwards', async () => {
    const newOrder = {
      name: 'Max',
      items: [{ orderId: 'abc', name: 'Mojito' }],
      note: 'ohne Eis',
    }

    const createResponse = await request(app).post('/api/orders').send(newOrder)

    expect(createResponse.status).toBe(201)
    expect(createResponse.body).toMatchObject(newOrder)
    expect(createResponse.body.orderId).toBeTypeOf('string')

    const listResponse = await request(app).get('/api/orders')
    expect(listResponse.body).toHaveLength(1)
    expect(listResponse.body[0]).toMatchObject(newOrder)
  })

  test('completing an order removes it from the open list', async () => {
    const createResponse = await request(app)
      .post('/api/orders')
      .send({ name: 'Max', items: [], note: '' })

    const { orderId } = createResponse.body

    const completeResponse = await request(app).patch(`/api/orders/${orderId}/complete`)
    expect(completeResponse.status).toBe(204)

    const listResponse = await request(app).get('/api/orders')
    expect(listResponse.body).toEqual([])
  })

  test('calls onChange after creating and completing an order', async () => {
    const onChange = vi.fn()
    app = buildTestApp({ onChange })

    const createResponse = await request(app)
      .post('/api/orders')
      .send({ name: 'Max', items: [], note: '' })

    expect(onChange).toHaveBeenCalledTimes(1)

    await request(app).patch(`/api/orders/${createResponse.body.orderId}/complete`)

    expect(onChange).toHaveBeenCalledTimes(2)
  })
})

describe('GET /api/orders/history', () => {
  let app

  beforeEach(() => {
    app = buildTestApp()
  })

  test('is empty for a guest with no completed orders', async () => {
    await request(app).post('/api/orders').send({ name: 'Max', items: [], note: '' })

    const response = await request(app).get('/api/orders/history').query({ guest: 'Max' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test('lists a guest completed order but not their still-open one', async () => {
    const toComplete = await request(app)
      .post('/api/orders')
      .send({ name: 'Max', items: [{ id: 1, name: 'Cable Car' }], note: '' })
    await request(app).patch(`/api/orders/${toComplete.body.orderId}/complete`)

    await request(app).post('/api/orders').send({ name: 'Max', items: [], note: '' })

    const response = await request(app).get('/api/orders/history').query({ guest: 'Max' })

    expect(response.body).toHaveLength(1)
    expect(response.body[0].orderId).toBe(toComplete.body.orderId)
  })

  test('does not include another guest completed orders', async () => {
    const anna = await request(app)
      .post('/api/orders')
      .send({ name: 'Anna', items: [], note: '' })
    await request(app).patch(`/api/orders/${anna.body.orderId}/complete`)

    const response = await request(app).get('/api/orders/history').query({ guest: 'Max' })

    expect(response.body).toEqual([])
  })
})

describe('unavailable ingredients', () => {
  let app

  beforeEach(() => {
    app = buildTestApp()
  })

  test('starts with no unavailable ingredients', async () => {
    const response = await request(app).get('/api/unavailable-ingredients')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test('marks an ingredient unavailable and lists it', async () => {
    const postResponse = await request(app)
      .post('/api/unavailable-ingredients')
      .send({ ingredient: 'Rum' })

    expect(postResponse.status).toBe(201)

    const listResponse = await request(app).get('/api/unavailable-ingredients')
    expect(listResponse.body).toEqual(['Rum'])
  })

  test('marks an ingredient available again', async () => {
    await request(app).post('/api/unavailable-ingredients').send({ ingredient: 'Rum' })

    const deleteResponse = await request(app)
      .delete('/api/unavailable-ingredients')
      .send({ ingredient: 'Rum' })

    expect(deleteResponse.status).toBe(204)

    const listResponse = await request(app).get('/api/unavailable-ingredients')
    expect(listResponse.body).toEqual([])
  })

  test('marking the same ingredient unavailable twice does not create duplicates', async () => {
    await request(app).post('/api/unavailable-ingredients').send({ ingredient: 'Rum' })
    await request(app).post('/api/unavailable-ingredients').send({ ingredient: 'Rum' })

    const listResponse = await request(app).get('/api/unavailable-ingredients')
    expect(listResponse.body).toEqual(['Rum'])
  })
})

describe('ratings', () => {
  let app

  beforeEach(() => {
    app = buildTestApp()
  })

  test('starts with no ratings for a guest', async () => {
    const response = await request(app).get('/api/ratings').query({ guest: 'Max' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test('rates a cocktail and lists it afterwards', async () => {
    const postResponse = await request(app)
      .post('/api/ratings')
      .send({ guestName: 'Max', cocktailId: 1, rating: 5 })

    expect(postResponse.status).toBe(201)

    const listResponse = await request(app).get('/api/ratings').query({ guest: 'Max' })
    expect(listResponse.body).toEqual([{ cocktailId: 1, rating: 5 }])
  })

  test('re-rating the same cocktail updates it instead of creating a duplicate', async () => {
    await request(app).post('/api/ratings').send({ guestName: 'Max', cocktailId: 1, rating: 2 })
    await request(app).post('/api/ratings').send({ guestName: 'Max', cocktailId: 1, rating: 5 })

    const listResponse = await request(app).get('/api/ratings').query({ guest: 'Max' })
    expect(listResponse.body).toEqual([{ cocktailId: 1, rating: 5 }])
  })

  test('rejects a rating outside the 1-5 range', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .send({ guestName: 'Max', cocktailId: 1, rating: 6 })

    expect(response.status).toBe(400)
  })

  test('rejects a non-integer rating', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .send({ guestName: 'Max', cocktailId: 1, rating: 2.5 })

    expect(response.status).toBe(400)
  })
})

describe('GET /api/recommendations', () => {
  let app

  beforeEach(() => {
    app = buildTestApp()
  })

  test('is empty for a guest with no ratings (cold start)', async () => {
    const response = await request(app).get('/api/recommendations').query({ guest: 'Max' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test('recommends a cocktail liked by a guest with the same taste', async () => {
    await request(app).post('/api/ratings').send({ guestName: 'Max', cocktailId: 1, rating: 5 })
    await request(app).post('/api/ratings').send({ guestName: 'Anna', cocktailId: 1, rating: 5 })
    await request(app).post('/api/ratings').send({ guestName: 'Anna', cocktailId: 2, rating: 4 })

    const response = await request(app).get('/api/recommendations').query({ guest: 'Max' })

    expect(response.body).toEqual([{ cocktailId: 2, predictedRating: 4 }])
  })
})

describe('POST /api/recommend-by-text', () => {
  const cocktailCatalog = [
    { id: 1, name: 'Cable Car', category: 'Sauer & Erfrischend', ingredients: ['Rum'] },
    { id: 16, name: 'Negroni', category: 'Kräftig & Herb', ingredients: ['Gin', 'Campari', 'Wermut'] },
  ]

  test('rejects a missing text', async () => {
    const app = buildTestApp()

    const response = await request(app)
      .post('/api/recommend-by-text')
      .send({ cocktails: cocktailCatalog })

    expect(response.status).toBe(400)
  })

  test('rejects a missing cocktail catalog', async () => {
    const app = buildTestApp()

    const response = await request(app)
      .post('/api/recommend-by-text')
      .send({ text: 'etwas Bitteres' })

    expect(response.status).toBe(400)
  })

  test('returns the ids and note from the recommender, given the catalog and the wish', async () => {
    const recommendByText = vi.fn().mockResolvedValue({ cocktailIds: [16], note: 'ohne Eis' })
    const app = buildTestApp({ recommendByText })

    const response = await request(app)
      .post('/api/recommend-by-text')
      .send({ text: 'etwas Bitteres, ohne Eis', cocktails: cocktailCatalog })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ cocktailIds: [16], note: 'ohne Eis' })
    expect(recommendByText).toHaveBeenCalledWith({
      text: 'etwas Bitteres, ohne Eis',
      cocktails: cocktailCatalog,
    })
  })

  test('responds with 502 when the recommender fails', async () => {
    const recommendByText = vi.fn().mockRejectedValue(new Error('Groq down'))
    const app = buildTestApp({ recommendByText })

    const response = await request(app)
      .post('/api/recommend-by-text')
      .send({ text: 'etwas Bitteres', cocktails: cocktailCatalog })

    expect(response.status).toBe(502)
  })

  test('responds with 429 and a machine-readable code when Groq is rate-limited', async () => {
    const rateLimitError = Object.assign(new Error('Rate limit reached'), { status: 429 })
    const recommendByText = vi.fn().mockRejectedValue(rateLimitError)
    const app = buildTestApp({ recommendByText })

    const response = await request(app)
      .post('/api/recommend-by-text')
      .send({ text: 'etwas Bitteres', cocktails: cocktailCatalog })

    expect(response.status).toBe(429)
    expect(response.body).toEqual({ error: 'rate_limited' })
  })
})
