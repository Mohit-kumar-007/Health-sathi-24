import { logout } from '../lib/auth'
import { Logo } from './Logo'

export function LearnerHeader({ displayName }: { displayName: string }) {
  return (
    <header className="border-b border-pale bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="/dashboard" aria-label="HealthSathi24 dashboard">
          <Logo />
        </a>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden text-sm font-bold text-navy sm:inline">{displayName}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border-2 border-navy/15 px-4 py-1.5 text-sm font-bold text-navy hover:border-navy/40"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
