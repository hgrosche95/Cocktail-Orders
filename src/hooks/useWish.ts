import { useRef, useState } from 'react'
import { sendJson } from '../api'
import type { Cocktail } from '../data/cocktails'
import type { Recommendation } from '../types'

// Rueckmeldung unter dem Wunschfeld, wenn keine Vorschlagsliste erscheint.
export type WishFeedback = 'no-match' | 'failed' | null

interface UseWishOptions {
  cocktails: Cocktail[]
  unavailableIngredients: string[]
  // Ein Drink aus dem Wunsch kommt in die Bestellung: der einzige Treffer
  // direkt oder einer, den der Gast aus der Vorschlagsliste waehlt.
  onSingleMatch: (cocktail: Cocktail) => void
}

/** Freitext-Wunsch ("etwas Bitteres, ohne Rum") -> passende Cocktails via Server/Groq. */
export function useWish({ cocktails, unavailableIngredients, onSingleMatch }: UseWishOptions) {
  const [textRecommendations, setTextRecommendations] = useState<Recommendation[]>([])
  const [isTextRecommending, setIsTextRecommending] = useState(false)
  const [wishNote, setWishNote] = useState('')
  const [wishFeedback, setWishFeedback] = useState<WishFeedback>(null)
  // Servierwunsch ("ohne Eis") bei mehreren Treffern: gilt erst, wenn der
  // Gast einen Drink aus der Vorschlagsliste waehlt, nicht fuer die Karte.
  const pendingNote = useRef('')
  // Nur fuer die aktuelle Sitzung (kein localStorage) - bei Neuladen der
  // Seite wird es einfach erneut versucht. Ein Groq-Tageslimit ist am
  // naechsten Tag ohnehin wieder frei, ein dauerhaftes Abschalten braucht es
  // dafuer nicht.
  const [isWishFeatureDisabled, setIsWishFeatureDisabled] = useState(false)

  function submitWish(text: string) {
    setIsTextRecommending(true)
    setWishFeedback(null)
    sendJson('/recommend-by-text', 'POST', { text })
      .then((res) => {
        // Groq-Tages-/Ratenlimit erreicht (siehe app.js) - Feature fuer den
        // Rest dieser Sitzung deaktivieren statt bei jedem weiteren Versuch
        // erneut ins Leere zu laufen.
        if (res.status === 429) {
          setIsWishFeatureDisabled(true)
          return null
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((result: { cocktailIds: number[]; note: string | null } | null) => {
        if (!result) return

        // Nicht verfuegbare Cocktails rausfiltern, bevor entschieden wird, ob
        // es "genau ein Treffer" ist - sonst koennte ein ausverkaufter
        // Cocktail automatisch in die Bestellung wandern.
        const availableCocktails = result.cocktailIds
          .map((id) => cocktails.find((c) => c.id === id))
          .filter((cocktail): cocktail is Cocktail => cocktail !== undefined)
          .filter(
            (cocktail) =>
              !cocktail.ingredients.some((ingredient) => unavailableIngredients.includes(ingredient))
          )

        if (availableCocktails.length === 0) {
          setTextRecommendations([])
          setWishFeedback('no-match')
          return
        }

        if (availableCocktails.length === 1) {
          onSingleMatch(availableCocktails[0])
          setWishNote(result.note ?? '')
          setTextRecommendations([])
          return
        }

        pendingNote.current = result.note ?? ''
        setTextRecommendations(
          availableCocktails.map((cocktail) => ({ cocktailId: cocktail.id, predictedRating: 0 }))
        )
      })
      .catch(() => {
        setTextRecommendations([])
        setWishFeedback('failed')
      })
      .finally(() => setIsTextRecommending(false))
  }

  /** Drink aus der Vorschlagsliste: mit dem Servierwunsch aus dem Text. */
  function pickWishMatch(cocktail: Cocktail) {
    onSingleMatch(cocktail)
    setWishNote(pendingNote.current)
  }

  return {
    textRecommendations,
    isTextRecommending,
    wishNote,
    wishFeedback,
    isWishFeatureDisabled,
    submitWish,
    pickWishMatch,
  }
}
