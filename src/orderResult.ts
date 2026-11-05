// Ausgang einer abgeschickten Bestellung, damit Leiste und Drink-Detail
// dieselbe Rueckmeldung geben.
export type OrderResult = 'sent' | 'already-open' | 'failed'

export function orderErrorMessage(result: OrderResult): string {
  if (result === 'already-open') return 'Du hast schon eine offene Bestellung an der Theke.'
  return 'Das hat nicht geklappt. Versuch es gleich noch einmal.'
}
