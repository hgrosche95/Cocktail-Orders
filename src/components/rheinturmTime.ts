// Eigene Datei statt Export aus RheinturmClock.tsx: React Fast Refresh
// verlangt, dass Komponenten-Dateien nur Komponenten exportieren.

export function pad(value: number): string {
  return String(value).padStart(2, '0')
}

// Die sechs Ziffern der Uhrzeit, so wie die Lichtzeituhr sie von oben nach
// unten zeigt: Stunden-Zehner, -Einer, Minuten-Zehner, -Einer,
// Sekunden-Zehner, -Einer.
export function clockDigits(date: Date): number[] {
  const time = pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds())
  return time.split('').map(Number)
}
