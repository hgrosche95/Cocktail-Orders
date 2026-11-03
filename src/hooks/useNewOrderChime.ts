import { useEffect, useRef } from 'react'
import type { SubmittedOrder } from '../types'

interface Options {
  // null, solange die offenen Bestellungen noch nicht geladen sind: die
  // beim Laden schon vorhandenen Bestellungen sind nicht "neu".
  orders: SubmittedOrder[] | null
  enabled: boolean
  play: () => void
}

/** Spielt den Gong, sobald eine Bestellung auftaucht, die noch nicht da war. */
export function useNewOrderChime({ orders, enabled, play }: Options) {
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (orders === null) return
    const ids = orders.map((order) => order.orderId)

    if (seen.current === null) {
      seen.current = new Set(ids)
      return
    }

    const known = seen.current
    const hasNew = ids.some((id) => !known.has(id))
    for (const id of ids) known.add(id)

    // Auch bei ausgeschaltetem Ton weiter mitzaehlen, damit beim
    // Einschalten keine alten Bestellungen nachklingeln.
    if (hasNew && enabled) play()
  }, [orders, enabled, play])
}
