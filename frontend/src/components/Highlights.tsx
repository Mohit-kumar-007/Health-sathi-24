import type { ReactNode } from 'react'

interface Highlight {
  title: string
  text: string
  icon: ReactNode
}

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'h-6 w-6',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const HIGHLIGHTS: Highlight[] = [
  {
    title: 'Short video lessons',
    text: 'Each lesson is a focused video you can finish in a few minutes, so learning fits into your day.',
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M10.5 9.5v5l4-2.5z" />
      </svg>
    ),
  },
  {
    title: 'Notes beside every video',
    text: 'Key points sit right under the video, written in plain language you can read again any time.',
    icon: (
      <svg {...iconProps}>
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4M10 12h6M10 16h6" />
      </svg>
    ),
  },
  {
    title: 'Progress that stays saved',
    text: 'Mark lessons complete and your place is remembered the next time you log in, on any device.',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l3 3 5-6" />
      </svg>
    ),
  },
]

export function Highlights() {
  return (
    <section aria-labelledby="highlights-heading" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
      <h2 id="highlights-heading" className="sr-only">
        Why learn with HealthSathi24
      </h2>
      <ul className="grid gap-5 md:grid-cols-3">
        {HIGHLIGHTS.map((item) => (
          <li key={item.title} className="rounded-2xl border border-pale bg-white p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint text-primary-dark">{item.icon}</span>
            <h3 className="mt-5 text-lg font-extrabold text-navy">{item.title}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
