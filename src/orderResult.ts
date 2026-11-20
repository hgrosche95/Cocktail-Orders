// Ausgang einer abgeschickten Bestellung, damit Leiste und Drink-Detail
// dieselbe Rueckmeldung geben. { failed: '...' } traegt den Text, den der
// Server geliefert hat (z.B. "gerade nicht verfuegbar"); der nackte Wert
// 'failed' bleibt fuer Absagen ohne lesbaren Server-Text (Netz weg, Antwort
// ohne Body).
// Erfolg ist nur 'sent'; jede Absage laeuft ueber orderErrorMessage().
export type OrderResult = 'sent' | 'already-open' | 'failed' | { failed: string }

// Einzige Stelle, die ueber die Union verzweigt: zuerst 'already-open', dann
// der Objektfall mit dem Servertext, zuletzt die Standardmeldung fuer 'failed'.
export function orderErrorMessage(result: OrderResult): string {
  if (result === 'already-open') return 'Du hast schon eine offene Bestellung an der Theke.'
  if (typeof result === 'object') return result.failed
  return 'Das hat nicht geklappt. Versuch es gleich noch einmal.'
}
