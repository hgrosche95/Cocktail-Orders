import { useEffect, useState } from 'react'
import { pad } from '../components/rheinturmTime'

// Grünkohl-Party: statt der Rheinturm-Lichtzeituhr dampft im Wartepanel ein
// Kohltopf, darunter die aktuelle Uhrzeit.
function Kohltopf() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(intervalId)
  }, [])

  const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  return (
    <div className="kohltopf" role="img" aria-label={`Dampfender Grünkohltopf, es ist ${timeText}`}>
      <svg viewBox="0 0 84 70" aria-hidden="true" focusable="false">
        <path className="kohltopf-steam" d="M30 20c-4-5 4-8 0-14M42 20c-4-5 4-8 0-14M54 20c-4-5 4-8 0-14" />
        <rect className="kohltopf-pot" x="14" y="28" width="56" height="36" rx="8" />
        <rect className="kohltopf-lid" x="10" y="24" width="64" height="7" rx="3.5" />
        <rect className="kohltopf-pot" x="4" y="34" width="10" height="5" rx="2.5" />
        <rect className="kohltopf-pot" x="70" y="34" width="10" height="5" rx="2.5" />
        <path className="kohltopf-shine" d="M24 48h36" />
      </svg>
      <span className="kohltopf-time">{timeText}</span>
    </div>
  )
}

export default Kohltopf
