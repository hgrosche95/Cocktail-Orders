// User-based Collaborative Filtering: findet Gaeste mit aehnlichem
// Bewertungsmuster wie der Ziel-Gast (Cosine-Similarity ueber gemeinsam
// bewertete Cocktails) und leitet daraus gewichtete Vorhersagen fuer noch
// nicht bewertete Cocktails ab. Bei dieser Datenmenge (wenige Gaeste,
// wenige Cocktails) reicht eine In-Memory-Berechnung ohne externe
// Bibliothek voellig aus.

function cosineSimilarity(ratingsA, ratingsB) {
  const sharedIds = Object.keys(ratingsA).filter((id) => id in ratingsB)
  if (sharedIds.length === 0) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (const id of sharedIds) {
    dotProduct += ratingsA[id] * ratingsB[id]
  }
  for (const value of Object.values(ratingsA)) normA += value * value
  for (const value of Object.values(ratingsB)) normB += value * value

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * @param {{ guestName: string, cocktailId: number, rating: number }[]} ratings - alle Bewertungen
 * @param {string} guestName - Gast, fuer den empfohlen werden soll
 * @param {number} limit - maximale Anzahl Empfehlungen
 * @returns {{ cocktailId: number, predictedRating: number }[]} absteigend sortiert
 */
export function recommendCocktails({ ratings, guestName, limit = 5 }) {
  const byGuest = new Map()
  for (const { guestName: guest, cocktailId, rating } of ratings) {
    if (!byGuest.has(guest)) byGuest.set(guest, {})
    byGuest.get(guest)[cocktailId] = rating
  }

  const targetRatings = byGuest.get(guestName) ?? {}
  const alreadyRated = new Set(Object.keys(targetRatings).map(Number))

  const scores = new Map()

  for (const [otherGuest, otherRatings] of byGuest) {
    if (otherGuest === guestName) continue

    const similarity = cosineSimilarity(targetRatings, otherRatings)
    if (similarity <= 0) continue

    for (const [cocktailIdKey, rating] of Object.entries(otherRatings)) {
      const cocktailId = Number(cocktailIdKey)
      if (alreadyRated.has(cocktailId)) continue

      const entry = scores.get(cocktailId) ?? { weightedSum: 0, weightTotal: 0 }
      entry.weightedSum += similarity * rating
      entry.weightTotal += similarity
      scores.set(cocktailId, entry)
    }
  }

  return Array.from(scores.entries())
    .map(([cocktailId, { weightedSum, weightTotal }]) => ({
      cocktailId,
      predictedRating: weightedSum / weightTotal,
    }))
    .sort((a, b) => b.predictedRating - a.predictedRating)
    .slice(0, limit)
}
