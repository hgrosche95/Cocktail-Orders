import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'

interface BarkeeperLoginProps {
  onLogin: (password: string) => Promise<boolean>
  /**
   * Nur dort gesetzt, wo die Demo erlaubt ist (/barkeeper). Karte und Statistik
   * bleiben ohne diese Prop beim Login, weil ihre Routen ein Token brauchen.
   */
  onStartDemo?: () => void
}

function BarkeeperLogin({ onLogin, onStartDemo }: BarkeeperLoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onLogin(password)
      .then((success) => {
        if (!success) {
          setError('Falsches Passwort.')
        }
      })
      .catch(() => setError('Server nicht erreichbar.'))
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <label className="field">
        Barkeeper-Passwort
        <input
          type="password"
          value={password}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block">
        Anmelden
      </button>
      {onStartDemo && (
        <button type="button" className="btn btn-ghost btn-block barkeeper-demo-btn" onClick={onStartDemo}>
          Demo ansehen (nur lesen)
        </button>
      )}
      {error && <p className="error-message">{error}</p>}
    </form>
  )
}

export default BarkeeperLogin
