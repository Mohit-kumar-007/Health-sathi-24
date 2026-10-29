export function CtaBand() {
  return (
    <section aria-labelledby="cta-heading" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
      <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-mint px-8 py-10 sm:flex-row sm:items-center">
        <div>
          <h2 id="cta-heading" className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            Ready for your first lesson?
          </h2>
          <p className="mt-2 max-w-xl text-ink-soft">Log in with the ID and password you received and start with one short video.</p>
        </div>
        <a
          href="/login"
          className="shrink-0 rounded-full bg-primary px-7 py-3.5 text-base font-bold text-white transition hover:bg-primary-dark"
        >
          Login
        </a>
      </div>
    </section>
  )
}
