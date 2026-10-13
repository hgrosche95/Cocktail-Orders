import { LEAF_PATH } from '../party/kohlblatt'

interface StarRatingProps {
  value: number
  onRate?: (rating: number) => void
}

const STARS = [1, 2, 3, 4, 5]

// Grünkohl-Party: bewertet wird mit Kohlblaettern statt Sternen.
function StarRating({ value, onRate }: StarRatingProps) {
  return (
    <div className="star-rating" role="group" aria-label="Bewertung">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          className={star <= value ? 'star star-filled' : 'star'}
          onClick={onRate ? () => onRate(star) : undefined}
          disabled={!onRate}
          aria-label={`${star} von 5 Kohlblättern`}
        >
          <svg viewBox="-14 -60 28 62" aria-hidden="true" focusable="false">
            <path d={LEAF_PATH} />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default StarRating
