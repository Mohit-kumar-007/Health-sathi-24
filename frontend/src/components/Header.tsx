import { useState } from 'react'
import { Logo } from './Logo'

const NAV = [
  { label: 'Home', href: '#home' },
  { label: 'Topics', href: '#topics' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-pale bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#home" aria-label="HealthSathi24 home">
          <Logo />
        </a>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-ink-soft transition hover:text-primary">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
          >
            Login
          </a>
          <button
            type="button"
            className="rounded-lg p-2 text-navy md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <nav id="mobile-nav" aria-label="Mobile navigation" className="border-t border-pale bg-ivory px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-3 text-base font-medium text-navy hover:bg-pale"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
