import { useState, useEffect, useCallback } from 'react'
import { getJson, sendJson } from '../api'
import type { SubmittedOrder, Recommendation } from '../types'

/**
 * Alles, was an einem Gast haengt: Bestellhistorie, eigene Bewertungen und
 * die daraus berechneten Empfehlungen. Laedt beim Anmelden und ueber
 * refreshGuestData, z.B. wenn der Server eine Aenderung meldet.
 */
export function useGuestData(currentUser: string, reportUnreachable: () => void) {
  const [history, setHistory] = useState<SubmittedOrder[]>([])
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

  const fetchRecommendations = useCallback((guest: string) => {
    getJson<Recommendation[]>(`/recommendations?guest=${encodeURIComponent(guest)}`)
      .then(setRecommendations)
      .catch(reportUnreachable)
  }, [reportUnreachable])

  const refreshGuestData = useCallback((guest: string) => {
    getJson<SubmittedOrder[]>(`/orders/history?guest=${encodeURIComponent(guest)}`)
      .then(setHistory)
      .catch(reportUnreachable)

    getJson<{ cocktailId: number; rating: number }[]>(`/ratings?guest=${encodeURIComponent(guest)}`)
      .then((data) => {
        const map: Record<number, number> = {}
        for (const { cocktailId, rating } of data) map[cocktailId] = rating
        setRatings(map)
      })
      .catch(reportUnreachable)

    fetchRecommendations(guest)
  }, [fetchRecommendations, reportUnreachable])

  useEffect(() => {
    if (!currentUser) return
    refreshGuestData(currentUser)
  }, [currentUser, refreshGuestData])

  function rateCocktail(cocktailId: number, rating: number) {
    sendJson('/ratings', 'POST', { guestName: currentUser, cocktailId, rating }).then((res) => {
      // Abgelehnte Bewertung (z.B. Cocktail nie serviert) nicht als
      // gespeichert anzeigen.
      if (!res.ok) return
      setRatings((prev) => ({ ...prev, [cocktailId]: rating }))
      fetchRecommendations(currentUser)
    }, reportUnreachable)
  }

  return { history, ratings, recommendations, refreshGuestData, rateCocktail }
}
