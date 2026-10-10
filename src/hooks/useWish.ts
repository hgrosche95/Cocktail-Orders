import { useState } from 'react'
import { sendJson } from '../api'
import type { Cocktail } from '../data/cocktails'
import type { Recommendation } from '../types'

interface UseWishOptions {
  cocktails: Cocktail[]
  unavailableIngredients: string[]
  // Genau ein passender Cocktail: direkt in die Bestellung uebernehmen.
  onSingleMatch: (cocktail: Cocktail) => void
}

/** Freitext-Wunsch ("etwas Bitteres, ohne Rum") -> passende Cocktails via Server/Groq. */
export function useWish({ cocktails, unavailableIngredients, onSingleMatch }: UseWishOptions) {
  const [textRecommendations, setTextRecommendations] = useState<Recommendation[]>([])
  const [isTextRecommending, setIsTextRecommending] = useState(false)
  const [wishNote, setWishNote] = useState('')
  // Nur fuer die aktuelle Sitzung (kein localStorage) - bei Neuladen der
  // Seite wird es einfach erneut versucht. Ein Groq-Tageslimit ist am
  // naechsten Tag ohnehin wieder frei, ein dauerhaftes Abschalten braucht es
  // dafuer nicht.
  const [isWishFeatureDisabled, setIsWishFeatureDisabled] = useState(false)

  function submitWish(text: string) {
    setIsTextRecommending(true)
    sendJson('/recommend-by-text', 'POST', { text })
      .then((res) => {
        // Groq-Tages-/Ratenlimit erreicht (siehe app.js) - Feature fuer den
        // Rest dieser Sitzung deaktivieren statt bei jedem weiteren Versuch
        // erneut ins Leere zu laufen.
        if (res.status === 429) {
          setIsWishFeatureDisabled(true)
          return null
        }
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

        if (availableCocktails.length === 1) {
          onSingleMatch(availableCocktails[0])
          setWishNote(result.note ?? '')
          setTextRecommendations([])
          return
        }

        setTextRecommendations(
          availableCocktails.map((cocktail) => ({ cocktailId: cocktail.id, predictedRating: 0 }))
        )
      })
      .catch(() => setTextRecommendations([]))
      .finally(() => setIsTextRecommending(false))
  }

  return { textRecommendations, isTextRecommending, wishNote, isWishFeatureDisabled, submitWish }
}
