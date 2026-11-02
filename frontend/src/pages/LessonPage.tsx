import { useEffect, useState } from 'react'
import { LearnerHeader } from '../components/LearnerHeader'
import { LessonList } from '../components/LessonList'
import { Markdown } from '../components/Markdown'
import { VideoPlayer } from '../components/VideoPlayer'
import {
  getCourse,
  getLesson,
  listProgress,
  setLessonCompleted,
  type CourseDetail,
  type LessonDetail,
  type LessonSummary,
} from '../lib/content'
import { Link, navigate } from '../lib/router'
import { useCurrentUser } from '../lib/useCurrentUser'

interface LessonPageProps {
  courseSlug: string
  lessonId?: string
}

interface LoadedCourse {
  detail: CourseDetail
  lessons: LessonSummary[]
}

function withCompletion(ids: Set<string>, lessonId: string, isCompleted: boolean): Set<string> {
  const next = new Set(ids)
  if (isCompleted) next.add(lessonId)
  else next.delete(lessonId)
  return next
}

function signOutIfExpired(status: number): boolean {
  if (status !== 401) return false
  window.location.replace('/login')
  return true
}

export default function LessonPage({ courseSlug, lessonId }: LessonPageProps) {
  const current = useCurrentUser()
  const isReady = current.status === 'ready'
  const [course, setCourse] = useState<LoadedCourse | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // The course and this learner's progress load once per course.
  useEffect(() => {
    if (!isReady) return
    let isActive = true
    setCourse(null)
    setError('')
    Promise.all([getCourse(courseSlug), listProgress()]).then(([courseResult, progressResult]) => {
      if (!isActive || signOutIfExpired(courseResult.status)) return
      if (courseResult.status === 404) return setError('We could not find that course.')
      if (!courseResult.ok || !courseResult.data) return setError(courseResult.error)
      setCourse({ detail: courseResult.data.course, lessons: courseResult.data.lessons })
      if (progressResult.ok && progressResult.data) {
        setCompletedIds(new Set(progressResult.data.completed.map((item) => item.lessonId)))
      }
    })
    return () => {
      isActive = false
    }
  }, [isReady, courseSlug])

  // Opening a course goes straight to the first lesson that isn't finished yet.
  useEffect(() => {
    if (!course || lessonId || course.lessons.length === 0) return
    const target = course.lessons.find((item) => !completedIds.has(item.id)) ?? course.lessons[0]
    navigate(`/learn/${courseSlug}/${target.id}`, { replace: true })
  }, [course, lessonId, completedIds, courseSlug])

  useEffect(() => {
    if (!isReady || !lessonId) return
    let isActive = true
    setLesson(null)
    setSaveError('')
    getLesson(lessonId).then((result) => {
      if (!isActive || signOutIfExpired(result.status)) return
      if (!result.ok || !result.data) return setError(result.status === 404 ? 'We could not find that lesson.' : result.error)
      if (result.data.lesson.courseSlug !== courseSlug) return setError('We could not find that lesson.')
      setError('')
      setLesson(result.data.lesson)
    })
    return () => {
      isActive = false
    }
  }, [isReady, lessonId, courseSlug])

  useEffect(() => {
    document.title = lesson && course ? `${lesson.title} | ${course.detail.title} | HealthSathi24` : 'Lesson | HealthSathi24'
  }, [lesson, course])

  async function toggleComplete() {
    if (!lesson || isSaving) return
    const willComplete = !completedIds.has(lesson.id)
    setIsSaving(true)
    setSaveError('')
    setCompletedIds((ids) => withCompletion(ids, lesson.id, willComplete))

    const result = await setLessonCompleted(lesson.id, willComplete)
    setIsSaving(false)
    if (signOutIfExpired(result.status)) return
    if (!result.ok) {
      setCompletedIds((ids) => withCompletion(ids, lesson.id, !willComplete))
      setSaveError("We couldn't save your progress. Try again.")
    }
  }

  if (current.status === 'loading') return <p className="p-8 text-ink-soft">Loading…</p>
  if (current.status === 'error') {
    return (
      <p role="alert" className="p-8 text-red-800">
        {current.message}
      </p>
    )
  }

  const lessons = course?.lessons ?? []
  const index = lessons.findIndex((item) => item.id === lessonId)
  const previous = index > 0 ? lessons[index - 1] : undefined
  const next = index >= 0 ? lessons[index + 1] : undefined
  const completedCount = lessons.filter((item) => completedIds.has(item.id)).length
  const isCompleted = lesson ? completedIds.has(lesson.id) : false
  const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

  return (
    <div className="min-h-screen bg-ivory">
      <LearnerHeader displayName={current.user.displayName} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link to="/dashboard" className="text-sm font-medium text-teal-text hover:underline">
          ← All courses
        </Link>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </p>
        )}
        {!error && !course && <p className="mt-6 text-ink-soft">Loading course…</p>}
        {course && lessons.length === 0 && (
          <div className="mt-6 rounded-2xl border border-pale bg-white p-8">
            <h1 className="text-2xl font-extrabold text-navy">{course.detail.title}</h1>
            <p className="mt-2 text-ink-soft">Lessons for this course are coming soon.</p>
          </div>
        )}

        {course && lessons.length > 0 && (
          <div className="mt-4 grid gap-6 lg:grid-cols-[19rem_1fr]">
            <aside>
              <div className="hidden self-start rounded-2xl border border-pale bg-pale/50 p-5 lg:sticky lg:top-6 lg:block">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-text">{course.detail.category.name}</p>
                <p className="mt-1 text-lg font-extrabold text-navy">{course.detail.title}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white" aria-hidden="true">
                  <div className="h-full rounded-full bg-leaf" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">
                  {completedCount} of {lessons.length} lessons complete
                </p>
                <div className="mt-4">
                  <LessonList courseSlug={courseSlug} lessons={lessons} currentId={lessonId} completedIds={completedIds} />
                </div>
              </div>

              <details key={lessonId} className="rounded-2xl border border-pale bg-white p-4 lg:hidden">
                <summary className="cursor-pointer font-bold text-navy">
                  {course.detail.title} · {completedCount} of {lessons.length} complete
                </summary>
                <div className="mt-3">
                  <LessonList courseSlug={courseSlug} lessons={lessons} currentId={lessonId} completedIds={completedIds} />
                </div>
              </details>
            </aside>

            <main>
              {lesson ? (
                <article>
                  <VideoPlayer videoId={lesson.youtubeVideoId} title={lesson.title} />

                  <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider text-teal-text">
                        Lesson {index + 1} of {lessons.length}
                      </p>
                      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{lesson.title}</h1>
                    </div>
                    <button
                      type="button"
                      onClick={toggleComplete}
                      aria-pressed={isCompleted}
                      disabled={isSaving}
                      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition disabled:opacity-70 ${
                        isCompleted
                          ? 'border-2 border-primary bg-mint text-primary-dark'
                          : 'bg-primary text-white hover:bg-primary-dark'
                      }`}
                    >
                      {isCompleted && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      )}
                      {isCompleted ? 'Completed' : 'Mark as complete'}
                    </button>
                  </div>

                  <div role="alert">
                    {saveError && (
                      <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{saveError}</p>
                    )}
                  </div>

                  <section aria-labelledby="notes-heading" className="mt-6 rounded-2xl border border-pale bg-white p-6">
                    <h2 id="notes-heading" className="text-lg font-extrabold text-navy">
                      Notes
                    </h2>
                    <div className="mt-3 text-ink-soft">
                      <Markdown source={lesson.notes} />
                    </div>
                  </section>

                  <nav aria-label="Lesson navigation" className="mt-6 flex items-center justify-between gap-3">
                    {previous ? (
                      <Link
                        to={`/learn/${courseSlug}/${previous.id}`}
                        className="rounded-full border-2 border-navy/15 px-5 py-2.5 text-sm font-bold text-navy hover:border-navy/40"
                      >
                        ← Previous
                      </Link>
                    ) : (
                      <span />
                    )}
                    {next && (
                      <Link
                        to={`/learn/${courseSlug}/${next.id}`}
                        className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
                      >
                        Next lesson →
                      </Link>
                    )}
                  </nav>
                </article>
              ) : (
                !error && <p className="text-ink-soft">Loading lesson…</p>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
