import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'

interface BarkeeperLoginProps {
  onLogin: (password: string) => Promise<boolean>
}

function BarkeeperLogin({ onLogin }: BarkeeperLoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onLogin(password).then((success) => {
      if (!success) {
        setError('Falsches Passwort.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <label className="field">
        Barkeeper-Passwort:
        <input
          type="password"
          value={password}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block">
        Anmelden
      </button>
      {error && <p className="error-message">{error}</p>}
    </form>
  )
}

export default BarkeeperLogin
