import { WebSocketServer } from 'ws'
import { createApp } from './app.js'

const PORT = 3001

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

function broadcastChange() {
  for (const client of clients) {
    client.send('orders-changed')
  }
}

if (!process.env.BARKEEPER_PASSWORD) {
  console.warn(
    'Warnung: BARKEEPER_PASSWORD ist nicht gesetzt (server/.env). Der Barkeeper-Login ist bis dahin nicht benutzbar.'
  )
}

const app = createApp({
  dbPath: process.env.DB_PATH || 'orders.db',
  barkeeperPassword: process.env.BARKEEPER_PASSWORD,
  onChange: broadcastChange,
})

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`)
})
