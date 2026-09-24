import { useEffect, useState } from 'react'
import { clockDigits, pad } from './rheinturmTime'

// Die Lichtzeituhr am Rheinturm wird von oben nach unten gelesen: je eine
// Lampengruppe pro Ziffer der Uhrzeit (siehe clockDigits). Wie viele Lampen
// einer Gruppe leuchten, ist die Ziffer; jede Gruppe ist so gross wie die
// hoechste Ziffer, die dort vorkommen kann.
const GROUP_SIZES = [2, 9, 5, 9, 5, 9]

function RheinturmClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(intervalId)
  }, [])

  const digits = clockDigits(now)
  const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  return (
    <div className="rheinturm" role="img" aria-label={`Lichtzeituhr des Rheinturms: ${timeText}`}>
      <span className="rheinturm-antenna" />
      <span className="rheinturm-neck" />
      <span className="rheinturm-roof" />
      <span className="rheinturm-rim" />
      <span className="rheinturm-pod" />
      <div className="rheinturm-shaft">
        {GROUP_SIZES.map((size, groupIndex) => (
          <div key={groupIndex} className="rheinturm-group">
            {Array.from({ length: size }, (_, lampIndex) => (
              <span
                key={lampIndex}
                className={lampIndex < digits[groupIndex] ? 'rheinturm-lamp on' : 'rheinturm-lamp'}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="rheinturm-base" />
      <span className="rheinturm-time">{timeText}</span>
    </div>
  )
}

export default RheinturmClock
