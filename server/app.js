import express from 'express'
import cors from 'cors'

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
    const rows = await prisma.order.findMany()
    const orders = rows.map((row) => ({
      orderId: row.orderId,
      name: row.name,
      items: row.items,
      note: row.note,
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

  app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params
    await prisma.order.deleteMany({ where: { orderId: id } })

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

  return app
}
