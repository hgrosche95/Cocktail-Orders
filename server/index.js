import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { prisma } from './prisma.js'
import { createApp } from './app.js'

const PORT = process.env.PORT || 3001

const clients = new Set()

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
  prisma,
  barkeeperPassword: process.env.BARKEEPER_PASSWORD,
  corsOrigin: process.env.CORS_ORIGIN,
  onChange: broadcastChange,
})

// HTTP und WebSocket teilen sich einen Port (statt getrennter Ports wie
// frueher) - Azure Container Apps kann pro App nur einen Ingress-Port
// bedienen, 'transport: auto' leitet WebSocket-Upgrades darueber mit durch.
const server = createServer(app)
const wss = new WebSocketServer({ server })

wss.on('connection', (socket) => {
  clients.add(socket)
  console.log('Client verbunden, aktuell verbunden:', clients.size)

  socket.on('close', () => {
    clients.delete(socket)
    console.log('Client getrennt, aktuell verbunden:', clients.size)
  })
})

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`)
})
