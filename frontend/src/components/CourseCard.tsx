import type { Course, IconKey } from '../lib/content'
import { Link } from '../lib/router'
import { TopicArt } from './TopicArt'

interface CourseCardProps {
  course: Course
  iconKey: IconKey
  categoryName: string
  completedCount: number
}

export function CourseCard({ course, iconKey, categoryName, completedCount }: CourseCardProps) {
  const total = course.lessonCount
  const done = Math.min(completedCount, total)
  const isAvailable = total > 0
  const isFinished = isAvailable && done >= total
  const percent = isAvailable ? Math.round((done / total) * 100) : 0

  const status = !isAvailable
    ? 'Lessons coming soon'
    : isFinished
      ? 'Completed'
      : done > 0
        ? `${done} of ${total} lessons done`
        : `${total} ${total === 1 ? 'lesson' : 'lessons'}`
  const action = isFinished ? 'Review' : done > 0 ? 'Continue' : 'Start'

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-pale bg-white transition hover:border-sage">
      <div className="aspect-[16/9]">
        <TopicArt kind={iconKey} label={`${categoryName} illustration`} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-extrabold text-navy">
          {isAvailable ? (
            <Link to={`/learn/${course.slug}`} className="after:absolute after:inset-0">
              {course.title}
            </Link>
          ) : (
            course.title
          )}
        </h3>
        <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{course.description}</p>
        {isAvailable && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-pale" aria-hidden="true">
            <div className="h-full rounded-full bg-leaf" style={{ width: `${percent}%` }} />
          </div>
        )}
        <p className="mt-3 flex items-center justify-between text-sm font-bold">
          <span className="text-teal-text">{status}</span>
          {isAvailable && <span className="text-primary">{action} →</span>}
        </p>
      </div>
    </article>
  )
}
