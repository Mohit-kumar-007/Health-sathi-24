import { useCallback, useEffect, useState } from 'react'
import { AdminLayout, StatusBadge } from '../components/AdminLayout'
import { CourseForm } from '../components/CourseForm'
import { LessonEditor } from '../components/LessonEditor'
import {
  createLesson,
  deleteCourse,
  deleteLesson,
  getAdminCourse,
  listAdminCategories,
  reorderLessons,
  updateCourse,
  updateLesson,
  type AdminCategory,
  type AdminCourse,
  type AdminLesson,
  type CourseInput,
  type LessonInput,
} from '../lib/adminContent'
import { Link, navigate } from '../lib/router'
import { useCurrentUser } from '../lib/useCurrentUser'

const NEW_LESSON = 'new'

const smallButton =
  'rounded-full border-2 border-navy/15 px-3.5 py-1 text-sm font-bold text-navy hover:border-navy/40 disabled:opacity-40'

export default function AdminCourseEditPage({ courseId }: { courseId: string }) {
  const current = useCurrentUser()
  const [course, setCourse] = useState<AdminCourse | null>(null)
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isConfirmingCourseDelete, setIsConfirmingCourseDelete] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const isAdmin = current.status === 'ready' && current.user.role === 'admin'

  const load = useCallback(async () => {
    const [courseResult, categoryResult] = await Promise.all([getAdminCourse(courseId), listAdminCategories()])
    if (courseResult.status === 401) return window.location.replace('/login')
    if (courseResult.status === 403) return window.location.replace('/dashboard')
    if (!courseResult.ok || !courseResult.data) {
      return setLoadError(courseResult.status === 404 ? 'We could not find that course.' : courseResult.error)
    }
    setLoadError('')
    setCourse(courseResult.data.course)
    setLessons(courseResult.data.lessons)
    if (categoryResult.ok && categoryResult.data) setCategories(categoryResult.data.categories)
  }, [courseId])

  useEffect(() => {
    document.title = 'Edit course | HealthSathi24 admin'
    if (current.status === 'ready' && current.user.role !== 'admin') window.location.replace('/dashboard')
  }, [current])

  useEffect(() => {
    if (isAdmin) void load()
  }, [isAdmin, load])

  async function saveCourse(input: CourseInput): Promise<string | null> {
    const result = await updateCourse(courseId, input)
    if (!result.ok || !result.data) return result.error
    setCourse(result.data.course)
    return null
  }

  async function saveLesson(input: LessonInput): Promise<string | null> {
    if (!editingId) return 'Nothing to save.'
    const result = editingId === NEW_LESSON ? await createLesson(courseId, input) : await updateLesson(editingId, input)
    if (!result.ok) return result.error
    setEditingId(null)
    await load()
    return null
  }

  async function moveLesson(index: number, direction: -1 | 1) {
    const target = index + direction
    if (isBusy || target < 0 || target >= lessons.length) return
    const reordered = [...lessons]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]

    setIsBusy(true)
    setActionError('')
    setLessons(reordered)
    const result = await reorderLessons(courseId, reordered.map((lesson) => lesson.id))
    setIsBusy(false)
    if (!result.ok) {
      setActionError(result.error)
      await load()
    }
  }

  async function removeLesson(lessonId: string) {
    setIsBusy(true)
    setActionError('')
    const result = await deleteLesson(lessonId)
    setIsBusy(false)
    setPendingDeleteId(null)
    if (!result.ok) return setActionError(result.error)
    await load()
  }

  async function removeCourse() {
    setIsBusy(true)
    setActionError('')
    const result = await deleteCourse(courseId)
    setIsBusy(false)
    if (!result.ok) return setActionError(result.error)
    navigate('/admin/courses')
  }

  if (current.status === 'loading') return <p className="p-8 text-ink-soft">Loading…</p>
  if (current.status === 'error') {
    return (
      <p role="alert" className="p-8 text-red-800">
        {current.message}
      </p>
    )
  }
  if (!isAdmin) return null

  return (
    <AdminLayout displayName={current.user.displayName} active="courses">
      <Link to="/admin/courses" className="text-sm font-medium text-teal-text hover:underline">
        ← All courses
      </Link>

      {loadError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {loadError}
        </p>
      )}
      {!loadError && !course && <p className="text-ink-soft">Loading course…</p>}

      {course && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-navy">{course.title}</h1>
              <StatusBadge status={course.status} />
            </div>
            {course.status === 'published' && (
              <Link to={`/learn/${course.slug}`} className="text-sm font-bold text-teal-text underline">
                View as a learner
              </Link>
            )}
          </div>

          <section aria-labelledby="details-heading" className="rounded-2xl border border-pale bg-white p-5 sm:p-6">
            <h2 id="details-heading" className="text-lg font-extrabold text-navy">
              Course details
            </h2>
            <div className="mt-4">
              <CourseForm
                key={course.id}
                categories={categories}
                initial={{
                  title: course.title,
                  description: course.description,
                  categoryId: course.categoryId,
                  status: course.status,
                }}
                submitLabel="Save changes"
                onSubmit={saveCourse}
              />
            </div>
          </section>

          <section aria-labelledby="lessons-heading" className="rounded-2xl border border-pale bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="lessons-heading" className="text-lg font-extrabold text-navy">
                Lessons ({lessons.length})
              </h2>
              <button
                type="button"
                onClick={() => setEditingId(NEW_LESSON)}
                className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark"
              >
                Add a lesson
              </button>
            </div>

            <div role="alert">
              {actionError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{actionError}</p>}
            </div>

            {editingId === NEW_LESSON && (
              <div className="mt-4">
                <LessonEditor onSave={saveLesson} onCancel={() => setEditingId(null)} />
              </div>
            )}

            {lessons.length === 0 && editingId !== NEW_LESSON && (
              <p className="mt-4 text-ink-soft">No lessons yet. Add the first one.</p>
            )}

            <ol className="mt-4 space-y-3">
              {lessons.map((lesson, index) =>
                editingId === lesson.id ? (
                  <li key={lesson.id}>
                    <LessonEditor initial={lesson} onSave={saveLesson} onCancel={() => setEditingId(null)} />
                  </li>
                ) : (
                  <li key={lesson.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-pale px-4 py-3">
                    <span className="w-6 text-sm font-bold text-ink-soft">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy">{lesson.title}</p>
                      <p className="text-xs text-ink-soft">
                        {lesson.youtubeVideoId ? `Video ${lesson.youtubeVideoId}` : 'No video yet'}
                      </p>
                    </div>
                    <StatusBadge status={lesson.status} />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Move "${lesson.title}" up`}
                        disabled={isBusy || index === 0}
                        onClick={() => moveLesson(index, -1)}
                        className={smallButton}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move "${lesson.title}" down`}
                        disabled={isBusy || index === lessons.length - 1}
                        onClick={() => moveLesson(index, 1)}
                        className={smallButton}
                      >
                        ↓
                      </button>
                      <button type="button" onClick={() => setEditingId(lesson.id)} className={smallButton}>
                        Edit
                      </button>
                      {pendingDeleteId === lesson.id ? (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => removeLesson(lesson.id)}
                            className="rounded-full bg-red-700 px-3.5 py-1 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60"
                          >
                            Yes, delete
                          </button>
                          <button type="button" onClick={() => setPendingDeleteId(null)} className={smallButton}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setPendingDeleteId(lesson.id)} className={smallButton}>
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ),
              )}
            </ol>
          </section>

          <section aria-labelledby="danger-heading" className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6">
            <h2 id="danger-heading" className="text-lg font-extrabold text-red-800">
              Delete this course
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              This permanently deletes the course, its {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} and every
              learner's progress in it. To hide it without deleting, set its status to Archived instead.
            </p>
            {isConfirmingCourseDelete ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={removeCourse}
                  className="rounded-full bg-red-700 px-5 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60"
                >
                  Yes, delete everything
                </button>
                <button type="button" onClick={() => setIsConfirmingCourseDelete(false)} className={smallButton}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingCourseDelete(true)}
                className="mt-4 rounded-full border-2 border-red-300 px-5 py-2 text-sm font-bold text-red-800 hover:border-red-500"
              >
                Delete course
              </button>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  )
}
