import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

// Eine Barkeeper-Schicht dauert einen Abend, danach muss man sich neu anmelden.
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

// Der Signaturschluessel wird aus dem Barkeeper-Passwort abgeleitet statt aus
// einem zusaetzlichen Secret: faelschen kann ein Token nur, wer das Passwort
// kennt, und ein neues Passwort macht alle alten Tokens ungueltig.
function signingKey(barkeeperPassword) {
  return createHmac('sha256', barkeeperPassword).update('barkeeper-token-v1').digest()
}

function sign(data, barkeeperPassword) {
  return createHmac('sha256', signingKey(barkeeperPassword)).update(data).digest('base64url')
}

// Vergleich in konstanter Zeit: ein normales === bricht beim ersten falschen
// Zeichen ab, und aus der Antwortzeit liesse sich das Passwort Zeichen fuer
// Zeichen erraten. Die SHA-256-Hashes sind immer gleich lang, was
// timingSafeEqual voraussetzt.
function safeEqual(a, b) {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export function passwordMatches(input, barkeeperPassword) {
  return Boolean(barkeeperPassword) && typeof input === 'string' && safeEqual(input, barkeeperPassword)
}

export function createBarkeeperToken(barkeeperPassword, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ role: 'barkeeper', exp: now + TOKEN_TTL_MS })).toString(
    'base64url'
  )
  return `${payload}.${sign(payload, barkeeperPassword)}`
}

export function isValidBarkeeperToken(token, barkeeperPassword, now = Date.now()) {
  if (!barkeeperPassword || typeof token !== 'string') return false

  const [payload, signature] = token.split('.')
  if (!payload || !signature || !safeEqual(signature, sign(payload, barkeeperPassword))) {
    return false
  }

  try {
    const { role, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return role === 'barkeeper' && typeof exp === 'number' && exp > now
  } catch {
    return false
  }
}

export function requireBarkeeper(barkeeperPassword) {
  return (req, res, next) => {
    const header = req.get('Authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null

    if (!isValidBarkeeperToken(token, barkeeperPassword)) {
      res.status(401).json({ error: 'barkeeper login required' })
      return
    }
    next()
  }
}
