import { useState } from 'react'

function BarkeeperLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
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
          onChange={(event) => setPassword(event.target.value)}
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
