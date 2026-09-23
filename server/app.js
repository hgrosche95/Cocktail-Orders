import express from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { recommendCocktails } from './recommendations.js'
import { recommendByText as defaultRecommendByText } from './groq.js'
import { createBarkeeperToken, passwordMatches, requireBarkeeper } from './barkeeperAuth.js'
import { cocktails, findCocktail } from './menu.js'

const MAX_NAME_LENGTH = 50
const MAX_NOTE_LENGTH = 200
const MAX_ITEMS_PER_ORDER = 5
const MAX_WISH_LENGTH = 300

// Gaeste einer Party sitzen meist hinter derselben WLAN-IP, deshalb sind die
// Limits pro IP grosszuegig und bremsen nur Skripte, keine echten Gaeste.
function limiter(windowMs, limit, extra = {}) {
  return rateLimit({ windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false, ...extra })
}

export function createApp({
  prisma,
  barkeeperPassword,
  corsOrigin,
  onChange = () => {},
  recommendByText = defaultRecommendByText,
} = {}) {
  const app = express()
  const barkeeperOnly = requireBarkeeper(barkeeperPassword)

  // Genau ein Proxy (Azure-Container-Apps-Ingress) vor dem Server, sonst waere
  // req.ip fuer alle Anfragen die Proxy-IP und alle teilten sich ein Limit.
  app.set('trust proxy', 1)

  // Ohne corsOrigin bleibt CORS offen (lokales Netzwerk: Gaeste greifen von
  // wechselnden LAN-IPs zu, die vorab nicht bekannt sind). In der Produktion
  // (Azure) wird corsOrigin auf die Static-Web-App-URL gesetzt.
  app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined))
  app.use(express.json())

  // req.path statt req.url: die Query enthaelt Gastnamen (?guest=...), die
  // nichts im Log verloren haben.
  app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.path)
    next()
  })

  app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok' })
  })

  // Nur Fehlversuche zaehlen: bremst Passwort-Raten, nie den echten Barkeeper.
  app.post(
    '/api/barkeeper-login',
    limiter(15 * 60 * 1000, 10, { skipSuccessfulRequests: true }),
    (req, res) => {
      if (passwordMatches(req.body?.password, barkeeperPassword)) {
        res.json({ success: true, token: createBarkeeperToken(barkeeperPassword) })
      } else {
        res.status(401).json({ success: false })
      }
    }
  )

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
    const { name, items, note = '' } = req.body ?? {}
    const trimmedName = typeof name === 'string' ? name.trim() : ''

    if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) {
      res.status(400).json({ error: `name must be 1-${MAX_NAME_LENGTH} characters` })
      return
    }
    if (typeof note !== 'string' || note.length > MAX_NOTE_LENGTH) {
      res.status(400).json({ error: `note must be at most ${MAX_NOTE_LENGTH} characters` })
      return
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS_PER_ORDER) {
      res.status(400).json({ error: `items must contain 1-${MAX_ITEMS_PER_ORDER} cocktails` })
      return
    }

    // Die Positionen werden aus der Server-Karte gebaut, nicht vom Client
    // uebernommen: der Client liefert nur, WELCHER Cocktail es ist.
    const menuItems = items.map((item) => findCocktail(item?.id))
    if (menuItems.some((cocktail) => !cocktail)) {
      res.status(400).json({ error: 'unknown cocktail' })
      return
    }
    const orderItems = menuItems.map((cocktail) => ({ ...cocktail, orderId: crypto.randomUUID() }))

    // Frueher nur im Client geprueft (hasOpenOrder in App.tsx).
    const openOrder = await prisma.order.findFirst({
      where: { name: trimmedName, completedAt: null },
    })
    if (openOrder) {
      res.status(409).json({ error: 'guest already has an open order' })
      return
    }

    const orderId = crypto.randomUUID()
    await prisma.order.create({
      data: { orderId, name: trimmedName, items: orderItems, note },
    })

    onChange()
    res.status(201).json({ orderId, name: trimmedName, items: orderItems, note })
  })

  // War frueher ein DELETE (Bestellung wurde komplett geloescht). Jetzt ein
  // Soft-Complete, damit die Bestellhistorie fuers Rating-/Empfehlungs-
  // Feature erhalten bleibt.
  app.patch('/api/orders/:id/complete', barkeeperOnly, async (req, res) => {
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

  app.post('/api/unavailable-ingredients', barkeeperOnly, async (req, res) => {
    const { ingredient } = req.body ?? {}
    if (typeof ingredient !== 'string' || !ingredient) {
      res.status(400).json({ error: 'ingredient is required' })
      return
    }

    await prisma.unavailableIngredient.upsert({
      where: { ingredient },
      create: { ingredient },
      update: {},
    })

    onChange()
    res.status(201).json({ ingredient })
  })

  app.delete('/api/unavailable-ingredients', barkeeperOnly, async (req, res) => {
    const { ingredient } = req.body ?? {}
    if (typeof ingredient !== 'string' || !ingredient) {
      res.status(400).json({ error: 'ingredient is required' })
      return
    }

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

  // Die Karte fuer den System-Prompt kommt aus shared/cocktails.json, nicht
  // vom Client: sonst koennte jeder beliebigen Text in den vertrauenswuerdigen
  // Teil des Prompts schreiben. Jede Anfrage kostet Groq-Kontingent, deshalb
  // Limit pro IP und Laengengrenze.
  app.post('/api/recommend-by-text', limiter(60 * 1000, 20), async (req, res) => {
    const { text } = req.body ?? {}

    if (typeof text !== 'string' || !text.trim() || text.length > MAX_WISH_LENGTH) {
      res.status(400).json({ error: `text must be 1-${MAX_WISH_LENGTH} characters` })
      return
    }

    try {
      const result = await recommendByText({ text, cocktails })
      res.json(result)
    } catch (error) {
      console.error('Groq-Anfrage fehlgeschlagen:', error)

      // Groq/OpenAI-SDK setzt bei HTTP 429 (Rate-/Tageslimit erreicht) die
      // .status-Property auf 429 - eigener Fehlercode dafuer, damit das
      // Frontend das Feature gezielt deaktivieren kann statt jeden Fehler
      // gleich zu behandeln.
      if (error?.status === 429) {
        res.status(429).json({ error: 'rate_limited' })
        return
      }

      res.status(502).json({ error: 'Empfehlung derzeit nicht verfügbar' })
    }
  })

  return app
}
