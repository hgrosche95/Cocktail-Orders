// Kurzer Gong fuer neue Bestellungen an der Theke, direkt per Web Audio
// erzeugt (keine Audiodatei noetig). Browser lassen Ton erst nach einer
// Beruehrung der Seite zu: unlockChime() bei einem Klick aufrufen, danach
// spielt playChime() auch ohne Klick.

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (context) return context
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  context = new Ctor()
  return context
}

export function unlockChime() {
  const ctx = getContext()
  if (ctx?.state === 'suspended') void ctx.resume()
}

export function playChime() {
  // Vibration zuerst: auf Handys ohne Ton (stumm geschaltet) bleibt sie.
  navigator.vibrate?.([120, 80, 120])

  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  // Zwei Toene (A5, E6), weich ein- und ausgeblendet.
  const now = ctx.currentTime
  ;[880, 1318.5].forEach((frequency, index) => {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = now + index * 0.18
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.65)
  })
}
