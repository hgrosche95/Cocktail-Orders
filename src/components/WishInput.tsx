import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'

interface WishInputProps {
  onSubmit: (text: string) => void
  isLoading: boolean
  isDisabled?: boolean
}

function WishInput({ onSubmit, isLoading, isDisabled = false }: WishInputProps) {
  const [text, setText] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isDisabled || !text.trim()) return
    onSubmit(text)
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <label className="field">
        Worauf hast du Lust?
        <input
          type="text"
          value={text}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.target.value)}
          placeholder="z. B. etwas Fruchtiges, nicht zu stark"
          maxLength={300}
          disabled={isDisabled}
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block" disabled={isLoading || isDisabled}>
        {isDisabled ? 'Gerade nicht verfügbar' : isLoading ? 'Wird gesucht …' : 'Vorschläge finden'}
      </button>
      {isDisabled && (
        <p className="error-message">Gerade nicht verfügbar — nutz einfach die Karte.</p>
      )}
    </form>
  )
}

export default WishInput
