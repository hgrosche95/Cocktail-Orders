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
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1L12 17l-5.5 2.9 1.2-6.1-4.5-4.2 6.1-.8z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default StarRating
