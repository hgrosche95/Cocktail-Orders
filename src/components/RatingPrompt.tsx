import { useState } from 'react'
import StarRating from './StarRating'

interface RatingPromptProps {
  cocktailName: string
  onRate: (rating: number) => void
  onDismiss: () => void
}

// Bleibt eingeklappt eine Zeile hoch, damit die Karte oben sichtbar bleibt.
// Die Sterne erscheinen erst, wenn der Gast wirklich bewerten will.
function RatingPrompt({ cocktailName, onRate, onDismiss }: RatingPromptProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="card rating-prompt">
      <button
        type="button"
        className="rating-prompt-toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>
          Wie hat dir <strong>{cocktailName}</strong> geschmeckt?
        </span>
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>
      {isOpen && (
        <div className="rating-prompt-body">
          <StarRating value={0} onRate={onRate} />
          <button type="button" className="btn btn-ghost btn-small" onClick={onDismiss}>
            Später
          </button>
        </div>
      )}
    </div>
  )
}

export default RatingPrompt
