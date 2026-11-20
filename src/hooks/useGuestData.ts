import { useState, useEffect, useCallback, useRef } from 'react'
import { getJson, sendJson } from '../api'
import type { SubmittedOrder, Recommendation } from '../types'

// Alles, was an einem Gast haengt, zusammen mit dem Namen, zu dem es gehoert.
interface GuestData {
  guest: string
  history: SubmittedOrder[]
  ratings: Record<number, number>
  recommendations: Recommendation[]
}

// Leerwert des Hooks. Wird zurueckgegeben, solange die geladenen Daten nicht
// zum aktuell angemeldeten Gast gehoeren. Die Felder werden von den Ansichten
// nur gelesen.
const NO_GUEST_DATA: GuestData = {
  guest: '',
  history: [],
  ratings: {},
  recommendations: [],
}

/**
 * Alles, was an einem Gast haengt: Bestellhistorie, eigene Bewertungen und
 * die daraus berechneten Empfehlungen. Laedt beim Anmelden und ueber
 * refreshGuestData, z.B. wenn der Server eine Aenderung meldet. Gehoeren die
 * Daten nicht (mehr) zum angemeldeten Gast - Abmelden, Namenswechsel, laedt
 * noch - zeigt der Hook seine Leerwerte, damit niemand die Daten seines
 * Vorgaengers sieht.
 */
export function useGuestData(currentUser: string, reportUnreachable: () => void) {
  const [data, setData] = useState<GuestData>(NO_GUEST_DATA)

  // Name, fuer den gerade Daten gezeigt werden sollen. Laedt ein Fetch fuer
  // einen Namen, der inzwischen abgemeldet ist, darf sein Ergebnis den State
  // nicht mehr erreichen.
  const activeGuestRef = useRef(currentUser)
  const isCurrentGuest = useCallback((guest: string) => guest === activeGuestRef.current, [])

  // Die Fehlermeldung haengt ueber einen Ref an der jeweils aktuellen Funktion
  // des Aufrufers. Wird sie direkt in die Callback-Kette genommen, erzeugt ein
  // Aufrufer mit inline uebergebener Funktion bei jedem Render neue Callbacks,
  // der Lade-Effekt laeuft wieder an, die Antwortaelnderungen erneuern den
  // State - eine Endlosschleife, die den Prozess auffrisst.
  const reportUnreachableRef = useRef(reportUnreachable)
  useEffect(() => {
    reportUnreachableRef.current = reportUnreachable
  })
  const reportFailure = useCallback(() => reportUnreachableRef.current(), [])

  // Ein Patch gehoert immer zu dem Namen, fuer den er gerufen wurde. Bei einem
  // anderen Namen starten die uebrigen Felder neu bei ihrem Leerwert.
  const patchGuestData = useCallback(
    (guest: string, patch: Partial<Omit<GuestData, 'guest'>>) => {
      setData((prev) => (prev.guest === guest ? { ...prev, ...patch } : { ...NO_GUEST_DATA, guest, ...patch }))
    },
    []
  )

  const fetchRecommendations = useCallback((guest: string) => {
    getJson<Recommendation[]>(`/recommendations?guest=${encodeURIComponent(guest)}`)
      .then((rows) => {
        if (isCurrentGuest(guest)) patchGuestData(guest, { recommendations: rows })
      })
      .catch(reportFailure)
  }, [isCurrentGuest, patchGuestData, reportFailure])

  const refreshGuestData = useCallback((guest: string) => {
    getJson<SubmittedOrder[]>(`/orders/history?guest=${encodeURIComponent(guest)}`)
      .then((rows) => {
        if (isCurrentGuest(guest)) patchGuestData(guest, { history: rows })
      })
      .catch(reportFailure)

    getJson<{ cocktailId: number; rating: number }[]>(`/ratings?guest=${encodeURIComponent(guest)}`)
      .then((rows) => {
        const map: Record<number, number> = {}
        for (const { cocktailId, rating } of rows) map[cocktailId] = rating
        if (isCurrentGuest(guest)) patchGuestData(guest, { ratings: map })
      })
      .catch(reportFailure)

    fetchRecommendations(guest)
  }, [fetchRecommendations, isCurrentGuest, patchGuestData, reportFailure])

  useEffect(() => {
    activeGuestRef.current = currentUser
    if (!currentUser) return
    refreshGuestData(currentUser)
  }, [currentUser, refreshGuestData])

  function rateCocktail(cocktailId: number, rating: number) {
    const guest = currentUser
    sendJson('/ratings', 'POST', { guestName: guest, cocktailId, rating }).then((res) => {
      // Abgelehnte Bewertung (z.B. Cocktail nie serviert) nicht als
      // gespeichert anzeigen.
      if (!res.ok) return
      if (!isCurrentGuest(guest)) return
      setData((prev) =>
        prev.guest === guest
          ? { ...prev, ratings: { ...prev.ratings, [cocktailId]: rating } }
          : prev
      )
      fetchRecommendations(guest)
    }, reportFailure)
  }

  const view = data.guest === currentUser ? data : NO_GUEST_DATA

  return {
    history: view.history,
    ratings: view.ratings,
    recommendations: view.recommendations,
    refreshGuestData,
    rateCocktail,
  }
}
