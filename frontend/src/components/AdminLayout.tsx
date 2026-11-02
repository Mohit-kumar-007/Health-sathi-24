import type { ReactNode } from 'react'
import type { ContentStatus } from '../lib/adminContent'
import { logout } from '../lib/auth'
import { Link } from '../lib/router'
import { Logo } from './Logo'

type Section = 'users' | 'courses'

const NAV: { key: Section; label: string; to: string }[] = [
  { key: 'users', label: 'Users', to: '/admin/users' },
  { key: 'courses', label: 'Courses', to: '/admin/courses' },
]

const STATUS_STYLES: Record<ContentStatus, string> = {
  draft: 'bg-amber-100 text-amber-900',
  published: 'bg-mint text-primary-dark',
  archived: 'bg-pale text-ink-soft',
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[status]}`}>{status}</span>
  )
}

interface AdminLayoutProps {
  displayName: string
  active: Section
  children: ReactNode
}

export function AdminLayout({ displayName, active, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      <aside className="flex flex-col justify-between gap-6 bg-navy p-5 text-white md:min-h-screen">
        <div>
          <a href="/" aria-label="HealthSathi24 home">
            <Logo light />
          </a>
          <nav aria-label="Admin navigation" className="mt-8 space-y-1.5">
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                aria-current={item.key === active ? 'page' : undefined}
                className={`block rounded-xl px-4 py-2.5 text-sm font-bold ${
                  item.key === active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <p className="text-sm text-white/70">Signed in as</p>
          <p className="font-bold">{displayName}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 rounded-full border-2 border-white/30 px-5 py-2 text-sm font-bold text-white hover:border-white/60"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="space-y-6 bg-ivory p-4 sm:p-8">{children}</main>
    </div>
  )
}
