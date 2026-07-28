import { describe, test, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createApp } from './app.js'

function buildTestApp(overrides = {}) {
  return createApp({
    dbPath: ':memory:',
    barkeeperPassword: 'test-password',
    ...overrides,
  })
}

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

  test('deletes an order by id', async () => {
    const createResponse = await request(app)
      .post('/api/orders')
      .send({ name: 'Max', items: [], note: '' })

    const { orderId } = createResponse.body

    const deleteResponse = await request(app).delete(`/api/orders/${orderId}`)
    expect(deleteResponse.status).toBe(204)

    const listResponse = await request(app).get('/api/orders')
    expect(listResponse.body).toEqual([])
  })

  test('calls onChange after creating and deleting an order', async () => {
    const onChange = vi.fn()
    app = buildTestApp({ onChange })

    const createResponse = await request(app)
      .post('/api/orders')
      .send({ name: 'Max', items: [], note: '' })

    expect(onChange).toHaveBeenCalledTimes(1)

    await request(app).delete(`/api/orders/${createResponse.body.orderId}`)

    expect(onChange).toHaveBeenCalledTimes(2)
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
