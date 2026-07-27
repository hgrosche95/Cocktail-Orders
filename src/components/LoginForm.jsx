import { useState } from 'react'

function LoginForm({ onLogin }) {
  const [name, setName] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (name.trim() === '') return
    onLogin(name)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Dein Name:
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <button type="submit">Anmelden</button>
    </form>
  )
}

export default LoginForm