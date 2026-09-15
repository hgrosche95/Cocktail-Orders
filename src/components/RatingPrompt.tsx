import StarRating from './StarRating'

interface RatingPromptProps {
  cocktailName: string
  onRate: (rating: number) => void
  onDismiss: () => void
}

function RatingPrompt({ cocktailName, onRate, onDismiss }: RatingPromptProps) {
  return (
    <div className="card rating-prompt">
      <p>
        Wie hat dir <strong>{cocktailName}</strong> geschmeckt?
      </p>
      <StarRating value={0} onRate={onRate} />
      <button type="button" className="btn btn-ghost btn-small" onClick={onDismiss}>
        Später
      </button>
    </div>
  )
}

export default RatingPrompt
