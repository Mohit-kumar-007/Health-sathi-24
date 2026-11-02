import type { LessonSummary } from '../lib/content'
import { Link } from '../lib/router'

interface LessonListProps {
  courseSlug: string
  lessons: LessonSummary[]
  currentId?: string
  completedIds: Set<string>
}

function StateIcon({ isDone, isCurrent }: { isDone: boolean; isCurrent: boolean }) {
  if (isDone) {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    )
  }
  return (
    <span
      className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${isCurrent ? 'border-teal bg-white' : 'border-sage/50'}`}
      aria-hidden="true"
    />
  )
}

export function LessonList({ courseSlug, lessons, currentId, completedIds }: LessonListProps) {
  return (
    <ol className="space-y-1.5">
      {lessons.map((lesson, index) => {
        const isCurrent = lesson.id === currentId
        const isDone = completedIds.has(lesson.id)
        return (
          <li key={lesson.id}>
            <Link
              to={`/learn/${courseSlug}/${lesson.id}`}
              aria-current={isCurrent ? 'page' : undefined}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isCurrent ? 'bg-white font-bold text-navy shadow-sm' : 'text-ink-soft hover:bg-white/70'
              }`}
            >
              <StateIcon isDone={isDone} isCurrent={isCurrent} />
              <span>
                <span className="sr-only">Lesson {index + 1}: </span>
                {lesson.title}
                {isDone && <span className="sr-only"> (completed)</span>}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
