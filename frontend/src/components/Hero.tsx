import { LessonPreview } from './LessonPreview'

export function Hero() {
  return (
    <section id="home" aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-pale"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-leaf" aria-hidden="true" />
            Health learning, made simple
          </p>
          <h1 id="hero-heading" className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Small steps today.
            <span className="block text-primary">Healthier tomorrows.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Short video lessons with clear notes on everyday health topics. Learn at your own pace and pick up right where you left off.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/login"
              className="rounded-full bg-primary px-7 py-3.5 text-base font-bold text-white transition hover:bg-primary-dark"
            >
              Login to start learning
            </a>
            <a
              href="#topics"
              className="rounded-full border-2 border-navy/15 px-7 py-3.5 text-base font-bold text-navy transition hover:border-navy/40"
            >
              Explore topics
            </a>
          </div>
          <p className="mt-5 text-sm text-ink-soft">Accounts are created by the HealthSathi24 team. There is no public sign-up.</p>
        </div>

        <LessonPreview />
      </div>
    </section>
  )
}
