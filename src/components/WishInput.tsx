import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import type { WishFeedback } from '../hooks/useWish'

interface WishInputProps {
  onSubmit: (text: string) => void
  isLoading: boolean
  isDisabled?: boolean
  feedback?: WishFeedback
}

const FEEDBACK_TEXT = {
  'no-match': 'Dazu passt gerade nichts auf der Karte. Beschreib es anders oder schau unten.',
  failed: 'Das hat nicht geklappt. Versuch es gleich noch einmal.',
}

function WishInput({ onSubmit, isLoading, isDisabled = false, feedback = null }: WishInputProps) {
  const [text, setText] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isDisabled || !text.trim()) return
    onSubmit(text)
  }

  return (
    <form onSubmit={handleSubmit} className="card wish-form">
      <label className="field">
        Worauf hast du Lust?
        <input
          type="text"
          value={text}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.target.value)}
          placeholder="z. B. fruchtig &amp; leicht"
          maxLength={300}
          disabled={isDisabled}
        />
      </label>
      <button
        type="submit"
        className="btn btn-ghost wish-submit"
        aria-label={isLoading ? undefined : 'Vorschläge finden'}
        disabled={isLoading || isDisabled}
      >
        {isLoading ? 'Sucht …' : 'Finden'}
      </button>
      {/* Steht immer im DOM, sonst lesen Screenreader die Meldung nicht vor. */}
      <div className="wish-feedback" aria-live="polite">
        {isDisabled ? (
          <p className="error-message">Gerade nicht verfügbar. Nutz einfach die Karte.</p>
        ) : (
          feedback && (
            <p className={feedback === 'failed' ? 'error-message' : 'wish-hint'}>
              {FEEDBACK_TEXT[feedback]}
            </p>
          )
        )}
      </div>
    </form>
  )
}

export default WishInput
