const STEPS = [
  { title: 'Choose a topic', text: 'Pick a category and a course that fits what you want to learn today.' },
  { title: 'Watch and read', text: 'Play the video, then read the notes written for that exact lesson.' },
  { title: 'Come back and learn more', text: 'Your progress is saved, so every visit continues where you stopped.' },
]

export function Journey() {
  return (
    <section id="how-it-works" aria-labelledby="journey-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <p className="text-sm font-bold uppercase tracking-wider text-teal-text">How it works</p>
      <h2 id="journey-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
        Learning in three easy moves
      </h2>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative rounded-2xl border border-pale bg-white p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white">
              {index + 1}
            </span>
            <h3 className="mt-5 text-lg font-extrabold text-navy">{step.title}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
