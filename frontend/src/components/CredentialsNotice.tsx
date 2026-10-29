import { useState } from 'react'

interface CredentialsNoticeProps {
  heading: string
  loginId: string
  password: string
  onDismiss: () => void
}

export function CredentialsNotice({ heading, loginId, password, onDismiss }: CredentialsNoticeProps) {
  const [hasCopied, setHasCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`Login ID: ${loginId}\nPassword: ${password}`)
      setHasCopied(true)
    } catch {
      setHasCopied(false)
    }
  }

  return (
    <section role="status" aria-label={heading} className="rounded-2xl border-2 border-leaf bg-mint p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-navy">{heading}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Share these with the learner. The password is shown only once and can't be looked up later. Learners can't change it themselves, so reset it here if it's lost.
          </p>
        </div>
        <button type="button" onClick={onDismiss} className="rounded-lg px-2 py-1 text-sm font-bold text-navy hover:bg-white/60">
          Dismiss
        </button>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-wider text-teal-text">Login ID</dt>
          <dd className="mt-1 break-all font-mono text-base font-bold text-navy">{loginId}</dd>
        </div>
        <div className="rounded-xl bg-white px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-wider text-teal-text">Password</dt>
          <dd className="mt-1 break-all font-mono text-base font-bold text-navy">{password}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
      >
        {hasCopied ? 'Copied' : 'Copy both'}
      </button>
    </section>
  )
}
