import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'

interface WishInputProps {
  onSubmit: (text: string) => void
  isLoading: boolean
}

function WishInput({ onSubmit, isLoading }: WishInputProps) {
  const [text, setText] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!text.trim()) return
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
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
        {isLoading ? 'Wird gesucht …' : 'Vorschläge finden'}
      </button>
    </form>
  )
}

export default WishInput
