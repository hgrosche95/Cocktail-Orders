import express from 'express'
import cors from 'cors'
import { recommendCocktails } from './recommendations.js'

export function createApp({ prisma, barkeeperPassword, corsOrigin, onChange = () => {} } = {}) {
  const app = express()

  // Ohne corsOrigin bleibt CORS offen (lokales Netzwerk: Gaeste greifen von
  // wechselnden LAN-IPs zu, die vorab nicht bekannt sind). In der Produktion
  // (Azure) wird corsOrigin auf die Static-Web-App-URL gesetzt.
  app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined))
  app.use(express.json())

  app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.url)
    next()
  })

  app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.post('/api/barkeeper-login', (req, res) => {
    const { password } = req.body

    if (password && password === barkeeperPassword) {
      res.json({ success: true })
    } else {
      res.status(401).json({ success: false })
    }
  })

  app.get('/api/orders', async (req, res) => {
    const rows = await prisma.order.findMany({ where: { completedAt: null } })
    const orders = rows.map((row) => ({
      orderId: row.orderId,
      name: row.name,
      items: row.items,
      note: row.note,
    }))
    res.json(orders)
  })

  app.get('/api/orders/history', async (req, res) => {
    const { guest } = req.query
    const rows = await prisma.order.findMany({
      where: { name: guest, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
    })
    const orders = rows.map((row) => ({
      orderId: row.orderId,
      name: row.name,
      items: row.items,
      note: row.note,
      completedAt: row.completedAt,
    }))
    res.json(orders)
  })

  app.post('/api/orders', async (req, res) => {
    const { name, items, note } = req.body
    const orderId = crypto.randomUUID()

    await prisma.order.create({ data: { orderId, name, items, note } })

    onChange()
    res.status(201).json({ orderId, name, items, note })
  })

  // War frueher ein DELETE (Bestellung wurde komplett geloescht). Jetzt ein
  // Soft-Complete, damit die Bestellhistorie fuers Rating-/Empfehlungs-
  // Feature erhalten bleibt.
  app.patch('/api/orders/:id/complete', async (req, res) => {
    const { id } = req.params
    await prisma.order.updateMany({
      where: { orderId: id },
      data: { completedAt: new Date() },
    })

    onChange()
    res.status(204).end()
  })

  app.get('/api/unavailable-ingredients', async (req, res) => {
    const rows = await prisma.unavailableIngredient.findMany()
    res.json(rows.map((row) => row.ingredient))
  })

  app.post('/api/unavailable-ingredients', async (req, res) => {
    const { ingredient } = req.body

    await prisma.unavailableIngredient.upsert({
      where: { ingredient },
      create: { ingredient },
      update: {},
    })

    onChange()
    res.status(201).json({ ingredient })
  })

  app.delete('/api/unavailable-ingredients', async (req, res) => {
    const { ingredient } = req.body

    await prisma.unavailableIngredient.deleteMany({ where: { ingredient } })

    onChange()
    res.status(204).end()
  })

  app.get('/api/ratings', async (req, res) => {
    const { guest } = req.query
    const rows = await prisma.rating.findMany({ where: { guestName: guest } })
    res.json(rows.map((row) => ({ cocktailId: row.cocktailId, rating: row.rating })))
  })

  app.post('/api/ratings', async (req, res) => {
    const { guestName, cocktailId, rating } = req.body

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'rating must be an integer between 1 and 5' })
      return
    }

    await prisma.rating.upsert({
      where: { guestName_cocktailId: { guestName, cocktailId } },
      create: { guestName, cocktailId, rating },
      update: { rating },
    })

    res.status(201).json({ guestName, cocktailId, rating })
  })

  // User-based Collaborative Filtering (siehe recommendations.js). Laedt
  // bei dieser Datenmenge (wenige Gaeste/Cocktails) problemlos alle
  // Bewertungen und berechnet die Empfehlung pro Anfrage in-memory statt
  // sie vorab zu materialisieren.
  app.get('/api/recommendations', async (req, res) => {
    const { guest } = req.query
    const ratings = await prisma.rating.findMany()
    const recommendations = recommendCocktails({ ratings, guestName: guest })
    res.json(recommendations)
  })

  return app
}
