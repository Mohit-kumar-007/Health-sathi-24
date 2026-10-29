import { useEffect, useState, type FormEvent } from 'react'
import { Logo, LogoMark } from '../components/Logo'
import { login } from '../lib/auth'

const AFTER_LOGIN_PATH = '/dashboard'

const BENEFITS = [
  'Pick up right where you left off',
  'Watch each video, then read its notes',
  'Your progress is saved to your account',
]

function EyeIcon({ isOff }: { isOff: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {isOff && <path d="M4 4l16 16" />}
    </svg>
  )
}

export default function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Login | HealthSathi24'
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const id = loginId.trim()
    if (!id || !password) {
      setError('Enter your ID and password.')
      return
    }

    setError('')
    setIsSubmitting(true)
    const result = await login(id, password)
    setIsSubmitting(false)

    if (result.ok) {
      window.location.assign(AFTER_LOGIN_PATH)
      return
    }
    setPassword('')
    setError(result.message)
  }

  const inputClass =
    'mt-2 w-full rounded-xl border-2 border-pale bg-white px-4 py-3 text-base text-navy placeholder:text-sage focus:border-teal focus:outline-none'

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/5" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-teal/25" aria-hidden="true" />

        <a href="/" aria-label="HealthSathi24 home" className="relative">
          <Logo light />
        </a>

        <div className="relative max-w-md">
          <LogoMark className="h-14 w-14" />
          <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight">Welcome back</h2>
          <p className="mt-3 text-lg leading-relaxed text-white/80">
            Log in with the ID and password from the HealthSathi24 team to continue your lessons.
          </p>
          <ul className="mt-8 space-y-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-white/90">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf text-white">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/60">Small steps today. Healthier tomorrows.</p>
      </aside>

      <main className="flex flex-col bg-ivory px-4 py-6 sm:px-8">
        <div className="lg:hidden">
          <a href="/" aria-label="HealthSathi24 home">
            <Logo />
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md rounded-3xl border border-pale bg-white p-8 shadow-[0_20px_50px_-35px_rgba(22,40,75,0.4)] sm:p-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-navy">Login</h1>
            <p className="mt-2 text-ink-soft">Enter the ID and password you were given.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-8">
              <div>
                <label htmlFor="login-id" className="text-sm font-bold text-navy">
                  Login ID
                </label>
                <input
                  id="login-id"
                  name="loginId"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={64}
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  placeholder="Your login ID"
                  className={inputClass}
                />
              </div>

              <div className="mt-5">
                <label htmlFor="password" className="text-sm font-bold text-navy">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                    aria-pressed={isPasswordVisible}
                    className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-lg p-1.5 text-ink-soft hover:text-navy"
                  >
                    <EyeIcon isOff={isPasswordVisible} />
                  </button>
                </div>
              </div>

              <div role="alert" className="min-h-6">
                {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? 'Logging in…' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">
              Forgot your password? Ask your HealthSathi24 administrator to reset it.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-ink-soft">
          <a href="/" className="font-medium text-teal-text hover:underline">
            Back to home
          </a>
          <span aria-hidden="true"> · </span>
          <a href="/privacy" className="hover:underline">
            Privacy Policy
          </a>
          <span aria-hidden="true"> · </span>
          <a href="/terms" className="hover:underline">
            Terms
          </a>
        </p>
      </main>
    </div>
  )
}
