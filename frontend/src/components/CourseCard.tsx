import type { Course, IconKey } from '../lib/content'
import { TopicArt } from './TopicArt'

interface CourseCardProps {
  course: Course
  iconKey: IconKey
  categoryName: string
}

export function CourseCard({ course, iconKey, categoryName }: CourseCardProps) {
  const lessonLabel =
    course.lessonCount > 0
      ? `${course.lessonCount} ${course.lessonCount === 1 ? 'lesson' : 'lessons'}`
      : 'Lessons coming soon'

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-pale bg-white">
      <div className="aspect-[16/9]">
        <TopicArt kind={iconKey} label={`${categoryName} illustration`} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-extrabold text-navy">{course.title}</h3>
        <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{course.description}</p>
        <p className="mt-4 text-sm font-bold text-teal-text">{lessonLabel}</p>
      </div>
    </article>
  )
}
