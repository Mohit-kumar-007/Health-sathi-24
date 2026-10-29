type LessonState = 'done' | 'current' | 'todo'

interface PreviewLesson {
  title: string
  state: LessonState
}

const LESSONS: PreviewLesson[] = [
  { title: 'Why sleep matters', state: 'done' },
  { title: 'Building a calm evening routine', state: 'current' },
  { title: 'Light, screens and rest', state: 'todo' },
  { title: 'Keeping a steady schedule', state: 'todo' },
]

function StateIcon({ state }: { state: LessonState }) {
  if (state === 'done') {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white" aria-label="Completed">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    )
  }
  return (
    <span
      className={`h-5 w-5 shrink-0 rounded-full border-2 ${state === 'current' ? 'border-teal bg-white' : 'border-sage/50'}`}
      aria-label={state === 'current' ? 'In progress' : 'Not started'}
    />
  )
}

export function LessonPreview() {
  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-2xl border border-pale bg-white shadow-[0_20px_50px_-30px_rgba(22,40,75,0.35)]">
        <div className="flex items-center gap-1.5 border-b border-pale bg-ivory px-4 py-2.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-sage/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-sage/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-sage/40" />
        </div>

        <div className="grid sm:grid-cols-[2fr_3fr]">
          <aside className="border-b border-pale bg-pale/50 p-4 sm:border-b-0 sm:border-r">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-text">Mental Health</p>
            <p className="mt-1 text-base font-extrabold text-navy">Sleep Balance</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white" role="img" aria-label="1 of 4 lessons complete">
              <div className="h-full w-1/4 rounded-full bg-leaf" />
            </div>
            <p className="mt-1.5 text-xs text-ink-soft">1 of 4 lessons complete</p>
            <ul className="mt-4 space-y-1.5">
              {LESSONS.map((lesson) => (
                <li
                  key={lesson.title}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${
                    lesson.state === 'current' ? 'bg-white font-bold text-navy shadow-sm' : 'text-ink-soft'
                  }`}
                >
                  <StateIcon state={lesson.state} />
                  {lesson.title}
                </li>
              ))}
            </ul>
          </aside>

          <div className="p-4">
            <div className="relative flex aspect-video items-center justify-center rounded-xl bg-navy">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-navy">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" />
                </svg>
              </span>
              <span className="absolute bottom-2 left-3 text-[11px] font-medium text-white/80">Video lesson</span>
            </div>
            <p className="mt-3 text-sm font-extrabold text-navy">Building a calm evening routine</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-teal-text">Notes</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              A short, steady wind-down helps your body know the day is ending. Pick two or three small habits you can repeat.
            </p>
            <div className="mt-2 space-y-1.5" aria-hidden="true">
              <div className="h-2 w-full rounded bg-pale" />
              <div className="h-2 w-4/5 rounded bg-pale" />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-ink-soft">
        Sample lesson screen: lessons on the left, video on top, notes right below.
      </figcaption>
    </figure>
  )
}
