import express from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { recommendCocktails } from './recommendations.js'
import { computeStats } from './stats.js'
import { recommendByText as defaultRecommendByText } from './groq.js'
import { createBarkeeperToken, passwordMatches, requireBarkeeper } from './barkeeperAuth.js'
import { categories, createMenu } from './menu.js'
import { parseCocktailInput } from './cocktailInput.js'

const MAX_NAME_LENGTH = 50
const MAX_NOTE_LENGTH = 200
const MAX_ITEMS_PER_ORDER = 5
const MAX_WISH_LENGTH = 300
// Zeitfenster, in dem die Theke eine erledigte Bestellung noch zurueckholen
// kann ("Rueckgaengig"-Button). Ausserhalb ist ein Fehltipp nicht mehr von
// einem bewussten Abschluss zu unterscheiden.
const RECENTLY_COMPLETED_MS = 10 * 60 * 1000

// Ein Gastname wird vorne und hinten getrimmt; innere Leerzeichen bleiben.
// Kein String (z.B. fehlender Query-Parameter) zaehlt als leer.
function guestName(value) {
  return typeof value === 'string' ? value.trim() : ''
}

// Gaeste einer Party sitzen meist hinter derselben WLAN-IP, deshalb sind die
// Limits pro IP grosszuegig und bremsen nur Skripte, keine echten Gaeste.
function limiter(windowMs, limit, extra = {}) {
  return rateLimit({ windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false, ...extra })
}

// Liefert das erste Cocktail-Item, das eine als leer markierte Zutat braucht,
// sonst undefined. Verglichen wird exakt wie im Client (CocktailList.tsx),
// ohne Normalisierung. Grundlage sind nur die Zutaten der Server-Karte.
function firstUnavailable(cocktails, unavailableSet) {
  return cocktails.find((cocktail) =>
    cocktail.ingredients.some((ingredient) => unavailableSet.has(ingredient))
  )
}

export function createApp({
  prisma,
  barkeeperPassword,
  corsOrigin,
  onChange = () => {},
  recommendByText = defaultRecommendByText,
  orderLimit = 5,
} = {}) {
  const app = express()
  const barkeeperOnly = requireBarkeeper(barkeeperPassword)
  const menu = createMenu(prisma)
  const TEN_MINUTES = 10 * 60 * 1000

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

  // Ganze Karte: Grundkarte aus shared/cocktails.json plus die Drinks, die
  // die Theke angelegt hat (custom: true).
  app.get('/api/menu', async (req, res) => {
    res.json(await menu.all())
  })

  // Name schon auf der Karte (Grundkarte oder eigene Drinks), ohne
  // Gross/Klein; exceptId: der Drink, der gerade bearbeitet wird.
  async function isNameTaken(name, exceptId) {
    const key = name.toLocaleLowerCase('de')
    const existing = await menu.all()
    return existing.some(
      (cocktail) => cocktail.id !== exceptId && cocktail.name.toLocaleLowerCase('de') === key
    )
  }

  app.post('/api/menu', barkeeperOnly, async (req, res) => {
    const parsed = parseCocktailInput(req.body, { categories })
    if (parsed.error) {
      res.status(400).json({ error: parsed.error })
      return
    }

    const { name, data } = parsed.value
    if (await isNameTaken(name)) {
      res.status(409).json({ error: 'a cocktail with this name already exists' })
      return
    }

    let row
    try {
      row = await prisma.customCocktail.create({ data: { name, data } })
    } catch (error) {
      // Gleichzeitig angelegt: der Unique-Index auf name greift.
      if (error?.code === 'P2002') {
        res.status(409).json({ error: 'a cocktail with this name already exists' })
        return
      }
      throw error
    }

    menu.invalidate()
    onChange()
    const findCocktail = await menu.finder()
    res.status(201).json(findCocktail(row.id))
  })

  // Eigenen Drink aendern (ganzer Eintrag, dieselben Regeln wie beim
  // Anlegen). Offene und alte Bestellungen behalten ihre Kopie, also die
  // Fassung von damals - auch an der Theke fuer schon bestellte Drinks.
  app.put('/api/menu/:id', barkeeperOnly, async (req, res) => {
    const id = Number(req.params.id)
    const row = Number.isInteger(id) ? await prisma.customCocktail.findUnique({ where: { id } }) : null
    if (!row) {
      res.status(404).json({ error: 'no custom cocktail with this id' })
      return
    }

    const parsed = parseCocktailInput(req.body, { categories })
    if (parsed.error) {
      res.status(400).json({ error: parsed.error })
      return
    }

    const { name, data } = parsed.value
    if (await isNameTaken(name, id)) {
      res.status(409).json({ error: 'a cocktail with this name already exists' })
      return
    }

    try {
      await prisma.customCocktail.update({ where: { id }, data: { name, data } })
    } catch (error) {
      if (error?.code === 'P2002') {
        res.status(409).json({ error: 'a cocktail with this name already exists' })
        return
      }
      throw error
    }

    menu.invalidate()
    onChange()
    const findCocktail = await menu.finder()
    res.json(findCocktail(id))
  })

  // Nur Drinks der Theke; die Grundkarte aendert sich nur per Commit.
  // Bestellungen behalten ihre Kopie des Drinks, Bewertungen bleiben stehen
  // (Statistik und Empfehlungen ueberspringen Drinks, die es nicht mehr gibt).
  app.delete('/api/menu/:id', barkeeperOnly, async (req, res) => {
    const id = Number(req.params.id)
    const { count } = Number.isInteger(id)
      ? await prisma.customCocktail.deleteMany({ where: { id } })
      : { count: 0 }
    if (count === 0) {
      res.status(404).json({ error: 'no custom cocktail with this id' })
      return
    }

    menu.invalidate()
    onChange()
    res.status(204).end()
  })

  app.get('/api/orders', async (req, res) => {
    // Die Reihenfolge ist die Warteschlange: der Gast leitet daraus seine
    // Position ab, die Theke arbeitet sie von oben nach unten ab.
    const rows = await prisma.order.findMany({
      where: { completedAt: null },
      orderBy: { createdAt: 'asc' },
    })
    const orders = rows.map((row) => ({
      orderId: row.orderId,
      name: row.name,
      items: row.items,
      note: row.note,
      startedAt: row.startedAt,
    }))
    res.json(orders)
  })

  app.get('/api/orders/history', async (req, res) => {
    const guest = guestName(req.query.guest)
    // Fehlender oder leerer Gast: leere Liste wie beim bisherigen leeren
    // Query-Wert, nicht (wie bisher bei fehlendem Parameter) alles. Kein
    // Aufrufer nutzt die ungefilterte Liste.
    if (!guest) {
      res.json([])
      return
    }
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

  // Liste fuer den "Rueckgaengig"-Button der Theke: nur Bestellungen, deren
  // completedAt hoechstens RECENTLY_COMPLETED_MS zurueckliegt (Grenze inclusive,
  // also genau vor 10 Minuten noch dabei). barkeeperOnly, weil Gaestenamen in
  // der Liste stehen. Route vor allen /api/orders/:id-Routen registrieren,
  // sonst liest ':id' das Wort 'recently-completed' als Bestellungs-id.
  app.get('/api/orders/recently-completed', barkeeperOnly, async (req, res) => {
    const rows = await prisma.order.findMany({
      where: { completedAt: { gte: new Date(Date.now() - RECENTLY_COMPLETED_MS) } },
      orderBy: { completedAt: 'desc' },
    })
    const orders = rows.map((row) => ({
      orderId: row.orderId,
      name: row.name,
      items: row.items,
      note: row.note,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
    }))
    res.json(orders)
  })

  // Begrenzt Bestellungen pro IP, damit niemand die Schlange fuellt. Der
  // Zaehler zaehlt auch abgelehnte Requests (400/409) mit. orderLimit ist
  // nur fuer E2E-Tests hochsetzbar, in der Produktion gilt 5.
  app.post('/api/orders', limiter(TEN_MINUTES, orderLimit), async (req, res) => {
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
    const findCocktail = await menu.finder()
    const menuItems = items.map((item) => findCocktail(item?.id))
    if (menuItems.some((cocktail) => !cocktail)) {
      res.status(400).json({ error: 'unknown cocktail' })
      return
    }

    // Bestand pruefen: der Client-Filter kann veraltet sein (die Seite wurde vor
    // der Markierung geladen), der Server ist die Grenze. Grundlage sind die
    // Zutaten der Server-Karte, nie Daten aus dem Request-Body. Ein Wettlauf
    // (die Theke markiert genau waehrend der Bestellung) wird nicht per
    // Transaktion abgesichert - fuer eine Hausbar reicht die Pruefung direkt
    // vor dem Anlegen.
    const unavailable = new Set(
      (await prisma.unavailableIngredient.findMany()).map((row) => row.ingredient)
    )
    const blockedCocktail = firstUnavailable(menuItems, unavailable)
    if (blockedCocktail) {
      res
        .status(409)
        .json({ error: `Dieser Drink ist gerade nicht verfuegbar: ${blockedCocktail.name}.` })
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
    try {
      await prisma.order.create({
        data: { orderId, name: trimmedName, items: orderItems, note },
      })
    } catch (error) {
      // Die Pruefung oben ist nicht atomar: kommen zwei Requests gleichzeitig
      // an, sehen beide noch keine offene Bestellung. Der partielle Unique-
      // Index (siehe schema.prisma) laesst dann nur einen durch.
      if (error?.code === 'P2002') {
        res.status(409).json({ error: 'guest already has an open order' })
        return
      }
      throw error
    }

    onChange()
    res.status(201).json({ orderId, name: trimmedName, items: orderItems, note })
  })

  // Storno durch den Gast selbst, solange die Bestellung offen ist. Gaeste
  // haben keine Accounts (siehe README, Security model): der Name im Body
  // muss zur Bestellung passen, mehr Nachweis gibt es nicht. Die Bestellung
  // wird geloescht statt markiert - sie wurde nie serviert, gehoert also
  // weder in die Historie noch in Bewertungen oder Statistik.
  app.delete('/api/orders/:id', async (req, res) => {
    const { name } = req.body ?? {}
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' })
      return
    }

    const where = { orderId: req.params.id, name: name.trim(), completedAt: null }
    const { count } = await prisma.order.deleteMany({ where: { ...where, startedAt: null } })
    if (count === 0) {
      // Wird schon gemixt: dann bleibt es dabei.
      if (await prisma.order.findFirst({ where })) {
        res.status(409).json({ error: 'order is already being prepared' })
        return
      }
      // Unbekannt, fremd oder schon fertig: fuer den Gast dasselbe.
      res.status(404).json({ error: 'no open order with this id for this guest' })
      return
    }

    onChange()
    res.status(204).end()
  })

  // Theke faengt an zu mixen: der Gast sieht "Wird gemixt". Mehrfaches
  // Antippen aendert den Zeitpunkt nicht.
  app.patch('/api/orders/:id/start', barkeeperOnly, async (req, res) => {
    const { count } = await prisma.order.updateMany({
      where: { orderId: req.params.id, completedAt: null, startedAt: null },
      data: { startedAt: new Date() },
    })
    const isOpen =
      count > 0 ||
      (await prisma.order.findFirst({ where: { orderId: req.params.id, completedAt: null } }))
    if (!isOpen) {
      res.status(404).json({ error: 'no open order with this id' })
      return
    }

    if (count > 0) onChange()
    res.status(204).end()
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

  // Rueckweg fuer einen Fehltipp an der Theke: geloescht wird nichts, es wird
  // nur das Datum zurueckgenommen, das complete gesetzt hat. startedAt bleibt
  // unangetastet, eine schon gestartete Bestellung liegt also wieder bei
  // "wird gemixt" und nicht unten in der Warteschlange.
  app.patch('/api/orders/:id/reopen', barkeeperOnly, async (req, res) => {
    const { id } = req.params
    const order = await prisma.order.findUnique({ where: { orderId: id } })
    if (!order) {
      res.status(404).json({ error: 'no order with this id' })
      return
    }
    // Nur erledigte Bestellungen koennen zurueckgeholt werden; fuer eine offene
    // waere der Aufruf ein sinnloser Doppler.
    if (order.completedAt === null) {
      res.status(409).json({ error: 'order is not completed' })
      return
    }

    try {
      await prisma.order.update({ where: { orderId: id }, data: { completedAt: null } })
    } catch (error) {
      // Der Gast hat nach dem Complete schon neu bestellt: der partielle
      // Unique-Index (siehe schema.prisma) laesst keine zweite offene Bestellung
      // zu. Das ist ein Konflikt wie beim Bestellen, kein Serverfehler.
      if (error?.code === 'P2002') {
        res.status(409).json({ error: 'guest already has an open order' })
        return
      }
      throw error
    }

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
    const guest = guestName(req.query.guest)
    // Fehlender oder leerer Gast: leere Liste wie beim bisherigen leeren
    // Query-Wert, nicht (wie bisher bei fehlendem Parameter) alles.
    if (!guest) {
      res.json([])
      return
    }
    const rows = await prisma.rating.findMany({ where: { guestName: guest } })
    res.json(rows.map((row) => ({ cocktailId: row.cocktailId, rating: row.rating })))
  })

  // Begrenzt Bewertungen pro IP. Eigener Zaehler, Bewertungen laufen nicht
  // gegen das Bestell-Limit (und umgekehrt).
  app.post('/api/ratings', limiter(TEN_MINUTES, 20), async (req, res) => {
    const { cocktailId, rating } = req.body ?? {}
    const guest = guestName(req.body?.guestName)

    // Laengennachweis erst nach dem Trimmen: "Testgast" plus 45 Leerzeichen
    // ist gueltig, ein reiner Leerzeichenname wie ein fehlender Name.
    if (!guest || guest.length > MAX_NAME_LENGTH) {
      res.status(400).json({ error: `guestName must be 1-${MAX_NAME_LENGTH} characters` })
      return
    }
    const findCocktail = await menu.finder()
    if (!findCocktail(cocktailId)) {
      res.status(400).json({ error: 'unknown cocktail' })
      return
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'rating must be an integer between 1 and 5' })
      return
    }

    // Bewerten nur, was man auch serviert bekommen hat (so bietet es auch
    // die Bestellhistorie an). Sonst koennte jeder beliebig viele Fantasie-
    // Bewertungen abgeben und die Empfehlungen fuer alle verfaelschen.
    const servedOrder = await prisma.order.findFirst({
      where: {
        name: guest,
        completedAt: { not: null },
        items: { array_contains: [{ id: cocktailId }] },
      },
    })
    if (!servedOrder) {
      res.status(403).json({ error: 'guest has not been served this cocktail' })
      return
    }

    await prisma.rating.upsert({
      where: { guestName_cocktailId: { guestName: guest, cocktailId } },
      create: { guestName: guest, cocktailId, rating },
      update: { rating },
    })

    res.status(201).json({ guestName: guest, cocktailId, rating })
  })

  // User-based Collaborative Filtering (siehe recommendations.js). Laedt
  // bei dieser Datenmenge (wenige Gaeste/Cocktails) problemlos alle
  // Bewertungen und berechnet die Empfehlung pro Anfrage in-memory statt
  // sie vorab zu materialisieren.
  app.get('/api/recommendations', async (req, res) => {
    const guest = guestName(req.query.guest)
    const ratings = await prisma.rating.findMany()
    // Ohne Gast (fehlend oder leer nach dem Trimmen) laeuft recommendCocktails
    // wie bisher mit undefined, also ohne Ziel-Gast.
    const recommendations = recommendCocktails({ ratings, guestName: guest || undefined })
    res.json(recommendations)
  })

  // Statistik fuer die Theke. ?since=<ISO-Zeitpunkt> schraenkt auf einen
  // Zeitraum ein (z.B. die aktuelle Party), ohne zaehlt alles.
  app.get('/api/stats', barkeeperOnly, async (req, res) => {
    const { since } = req.query
    let sinceDate
    if (since !== undefined) {
      sinceDate = new Date(since)
      if (typeof since !== 'string' || Number.isNaN(sinceDate.getTime())) {
        res.status(400).json({ error: 'since must be an ISO date' })
        return
      }
    }

    const [servedOrders, ratings, openOrders] = await Promise.all([
      prisma.order.findMany({
        where: { completedAt: sinceDate ? { gte: sinceDate } : { not: null } },
        select: { name: true, items: true },
      }),
      prisma.rating.findMany({
        where: sinceDate ? { updatedAt: { gte: sinceDate } } : {},
        select: { cocktailId: true, rating: true },
      }),
      prisma.order.count({ where: { completedAt: null } }),
    ])

    const findCocktail = await menu.finder()
    res.json({ ...computeStats({ servedOrders, ratings, findCocktail }), openOrders })
  })

  // Die Karte fuer den System-Prompt kommt vom Server (Grundkarte plus
  // Drinks der Theke, siehe menu.js), nicht
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
      const result = await recommendByText({ text, cocktails: await menu.all() })
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

  // Unbekannte API-Pfade als JSON statt Expresss HTML-Seite.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'not_found' })
  })

  // Fehler aus den Routen (Express 5 leitet auch abgelehnte Promises hierher
  // weiter, z.B. wenn die Datenbank nicht erreichbar ist). Ohne diesen
  // Handler antwortet Express mit einer HTML-Seite, die ausserhalb der
  // Produktion den Stacktrace enthaelt.
  // eslint-disable-next-line no-unused-vars -- Express erkennt Fehler-Handler an den 4 Parametern
  app.use((error, req, res, next) => {
    // Fehler mit Status < 500 kommen von Express selbst, z.B. kaputtes JSON
    // im Body (400) oder zu grosser Body (413).
    if (error.status >= 400 && error.status < 500) {
      res.status(error.status).json({ error: error.type ?? 'bad_request' })
      return
    }

    console.error(new Date().toISOString(), req.method, req.path, error)
    res.status(500).json({ error: 'internal_error' })
  })

  return app
}
