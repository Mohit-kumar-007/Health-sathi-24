import { useEffect, type ReactNode } from 'react'
import { Footer } from './Footer'
import { Header } from './Header'

// While this is true, a notice at the top of each legal page says the text is a draft.
// Set it to false once the site owner (and ideally a lawyer) has reviewed and approved the wording.
const SHOW_DRAFT_NOTICE = true

interface LegalLayoutProps {
  title: string
  updated: string
  children: ReactNode
}

export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  useEffect(() => {
    document.title = `${title} | HealthSathi24`
  }, [title])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated {updated}</p>
        {SHOW_DRAFT_NOTICE && (
          <p role="note" className="mt-6 rounded-xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900">
            Draft for review. This text has not been checked by a lawyer yet, and should be reviewed and approved before the
            site launches.
          </p>
        )}
        <div className="mt-8 space-y-8 leading-relaxed text-ink-soft">{children}</div>
      </main>
      <Footer />
    </>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-extrabold text-navy">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}
