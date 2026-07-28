import express from 'express'
import cors from 'cors'
import { DatabaseSync } from 'node:sqlite'

export function createApp({ dbPath = 'orders.db', barkeeperPassword, onChange = () => {} } = {}) {
  const app = express()
  const db = new DatabaseSync(dbPath)

  app.use(cors())
  app.use(express.json())

  app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.url)
    next()
  })

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      orderId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      items TEXT NOT NULL,
      note TEXT
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS unavailable_ingredients (
      ingredient TEXT PRIMARY KEY
    )
  `)

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

  app.get('/api/orders', (req, res) => {
    const rows = db.prepare('SELECT * FROM orders').all()
    const orders = rows.map((row) => ({
      orderId: row.orderId,
      name: row.name,
      items: JSON.parse(row.items),
      note: row.note,
    }))
    res.json(orders)
  })

  app.post('/api/orders', (req, res) => {
    const { name, items, note } = req.body
    const orderId = crypto.randomUUID()

    db.prepare('INSERT INTO orders (orderId, name, items, note) VALUES (?, ?, ?, ?)').run(
      orderId,
      name,
      JSON.stringify(items),
      note
    )

    onChange()
    res.status(201).json({ orderId, name, items, note })
  })

  app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params
    db.prepare('DELETE FROM orders WHERE orderId = ?').run(id)

    onChange()
    res.status(204).end()
  })

  app.get('/api/unavailable-ingredients', (req, res) => {
    const rows = db.prepare('SELECT ingredient FROM unavailable_ingredients').all()
    res.json(rows.map((row) => row.ingredient))
  })

  app.post('/api/unavailable-ingredients', (req, res) => {
    const { ingredient } = req.body

    db.prepare(
      'INSERT OR IGNORE INTO unavailable_ingredients (ingredient) VALUES (?)'
    ).run(ingredient)

    onChange()
    res.status(201).json({ ingredient })
  })

  app.delete('/api/unavailable-ingredients', (req, res) => {
    const { ingredient } = req.body

    db.prepare('DELETE FROM unavailable_ingredients WHERE ingredient = ?').run(ingredient)

    onChange()
    res.status(204).end()
  })

  return app
}
