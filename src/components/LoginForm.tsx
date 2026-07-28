import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'

interface LoginFormProps {
  onLogin: (name: string) => void
}

function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
          onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block">
        Anmelden
      </button>
    </form>
  )
}

export default LoginForm
