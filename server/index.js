import express from 'express'
import cors from 'cors'
import { DatabaseSync } from 'node:sqlite'
import { WebSocketServer } from 'ws'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url)
  next()
})

const db = new DatabaseSync('orders.db')

// TODO: eigenes Passwort setzen, bevor du die App für echte Gäste nutzt
const BARKEEPER_PASSWORD = 'schwertfisch'

const wss = new WebSocketServer({ port: 3002 })
const clients = new Set()

wss.on('connection', (socket) => {
  clients.add(socket)
  console.log('Client verbunden, aktuell verbunden:', clients.size)

  socket.on('close', () => {
    clients.delete(socket)
    console.log('Client getrennt, aktuell verbunden:', clients.size)
  })
})

function broadcastOrdersChanged() {
  for (const client of clients) {
    client.send('orders-changed')
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    orderId TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    items TEXT NOT NULL,
    note TEXT
  )
`)

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/barkeeper-login', (req, res) => {
  const { password } = req.body

  if (password === BARKEEPER_PASSWORD) {
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

  broadcastOrdersChanged()
  res.status(201).json({ orderId, name, items, note })
})

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM orders WHERE orderId = ?').run(id)

  broadcastOrdersChanged()
  res.status(204).end()
})

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`)
})