import { useState } from 'react'

function LoginForm({ onLogin }) {
  const [name, setName] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (name.trim() === '') return
    onLogin(name)
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <label className="field">
        Dein Name:
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block">
        Anmelden
      </button>
    </form>
  )
}

export default LoginForm