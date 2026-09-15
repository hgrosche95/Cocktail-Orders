interface StarRatingProps {
  value: number
  onRate?: (rating: number) => void
}

const STARS = [1, 2, 3, 4, 5]

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
          aria-label={`${star} von 5 Sternen`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default StarRating
