import { useState, type FormEvent } from 'react'
import { createUser } from '../lib/users'

interface CreateUserFormProps {
  onCreated: (loginId: string, password: string) => void
}

const LOGIN_ID_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/
const MIN_PASSWORD_LENGTH = 8

const inputClass =
  'mt-1.5 w-full rounded-xl border-2 border-pale bg-white px-4 py-2.5 text-base text-navy placeholder:text-sage focus:border-teal focus:outline-none'

export function CreateUserForm({ onCreated }: CreateUserFormProps) {
  const [loginId, setLoginId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const id = loginId.trim()
    const name = displayName.trim()
    if (!LOGIN_ID_PATTERN.test(id)) {
      setError('Login ID must be 3 to 64 letters, numbers, dots, dashes or underscores.')
      return
    }
    if (!name) {
      setError('Enter the learner’s name.')
      return
    }
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      setError(`A password you choose must be at least ${MIN_PASSWORD_LENGTH} characters, or leave it blank.`)
      return
    }

    setError('')
    setIsSubmitting(true)
    const result = await createUser({ loginId: id, displayName: name, password: password || undefined })
    setIsSubmitting(false)

    if (!result.ok || !result.data) {
      setError(result.error)
      return
    }
    setLoginId('')
    setDisplayName('')
    setPassword('')
    onCreated(result.data.user.loginId, result.data.temporaryPassword)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-pale bg-white p-5 sm:p-6">
      <h2 className="text-lg font-extrabold text-navy">Create a learner account</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="new-login-id" className="text-sm font-bold text-navy">
            Login ID
          </label>
          <input
            id="new-login-id"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            maxLength={64}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="asha.k"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="new-display-name" className="text-sm font-bold text-navy">
            Name
          </label>
          <input
            id="new-display-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={100}
            autoComplete="off"
            placeholder="Asha Kumar"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="new-password" className="text-sm font-bold text-navy">
            Password <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input
            id="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            maxLength={72}
            autoComplete="off"
            spellCheck={false}
            placeholder="Leave blank to generate one"
            className={inputClass}
          />
        </div>
      </div>

      <div role="alert" className="min-h-6">
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 rounded-full bg-primary px-6 py-3 text-base font-bold text-white transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting ? 'Creating…' : 'Create account'}
      </button>
    </form>
  )
}
