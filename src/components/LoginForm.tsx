import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'

interface LoginFormProps {
  onLogin: (name: string) => void
}

// Die Begruessung ("Ueber den Daechern ...") steht im Header ueber der
// Skyline, hier bleibt nur das eigentliche Formular.
function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Handy-Tastaturen haengen nach einem Wortvorschlag automatisch ein
    // Leerzeichen an. Der Server speichert Getrimmtes, also hier trimmen.
    const trimmed = name.trim()
    if (trimmed === '') return
    onLogin(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <label className="field">
        Wer kommt hoch?
        <input
          type="text"
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
          maxLength={50}
          autoComplete="off"
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block btn-split">
        <span>Hochfahren</span>
        <span aria-hidden="true">↑</span>
      </button>
    </form>
  )
}

export default LoginForm
