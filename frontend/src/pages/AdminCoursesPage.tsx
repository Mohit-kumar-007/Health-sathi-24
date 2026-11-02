import { useEffect, useState } from 'react'
import { AdminLayout, StatusBadge } from '../components/AdminLayout'
import { CourseForm } from '../components/CourseForm'
import {
  createCourse,
  listAdminCategories,
  listAdminCourses,
  type AdminCategory,
  type AdminCourseRow,
  type CourseInput,
} from '../lib/adminContent'
import { Link, navigate } from '../lib/router'
import { useCurrentUser } from '../lib/useCurrentUser'

export default function AdminCoursesPage() {
  const current = useCurrentUser()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [courses, setCourses] = useState<AdminCourseRow[] | null>(null)
  const [loadError, setLoadError] = useState('')

  const isAdmin = current.status === 'ready' && current.user.role === 'admin'

  useEffect(() => {
    document.title = 'Courses | HealthSathi24 admin'
    if (current.status === 'ready' && current.user.role !== 'admin') window.location.replace('/dashboard')
  }, [current])

  useEffect(() => {
    if (!isAdmin) return
    Promise.all([listAdminCategories(), listAdminCourses()]).then(([categoryResult, courseResult]) => {
      if (courseResult.status === 401) return window.location.replace('/login')
      if (courseResult.status === 403) return window.location.replace('/dashboard')
      if (!courseResult.ok || !courseResult.data) return setLoadError(courseResult.error)
      setLoadError('')
      setCourses(courseResult.data.courses)
      if (categoryResult.ok && categoryResult.data) setCategories(categoryResult.data.categories)
    })
  }, [isAdmin])

  async function handleCreate(input: CourseInput): Promise<string | null> {
    const result = await createCourse(input)
    if (!result.ok || !result.data) return result.error
    navigate(`/admin/courses/${result.data.course.id}`)
    return null
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
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">Courses</h1>
        <p className="mt-1 text-ink-soft">Create courses and add lessons with a video and notes. Drafts are hidden from learners.</p>
      </div>

      {categories.length > 0 && (
        <section aria-labelledby="new-course-heading" className="rounded-2xl border border-pale bg-white p-5 sm:p-6">
          <h2 id="new-course-heading" className="text-lg font-extrabold text-navy">
            Create a course
          </h2>
          <div className="mt-4">
            <CourseForm categories={categories} submitLabel="Create course" onSubmit={handleCreate} />
          </div>
        </section>
      )}

      <section aria-labelledby="all-courses-heading" className="rounded-2xl border border-pale bg-white p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="all-courses-heading" className="text-lg font-extrabold text-navy">
            All courses
          </h2>
          {courses && <p className="text-sm text-ink-soft">{courses.length} total</p>}
        </div>

        <div role="alert">
          {loadError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{loadError}</p>}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-pale text-xs uppercase tracking-wider text-ink-soft">
                <th scope="col" className="py-2 pr-4 font-bold">Course</th>
                <th scope="col" className="py-2 pr-4 font-bold">Category</th>
                <th scope="col" className="py-2 pr-4 font-bold">Status</th>
                <th scope="col" className="py-2 font-bold">Lessons</th>
              </tr>
            </thead>
            <tbody>
              {courses?.map((course) => (
                <tr key={course.id} className="border-b border-pale/70 last:border-0">
                  <td className="py-3 pr-4 font-bold">
                    <Link to={`/admin/courses/${course.id}`} className="text-navy underline decoration-pale underline-offset-4 hover:decoration-teal">
                      {course.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{course.categoryName}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={course.status} />
                  </td>
                  <td className="py-3 text-ink-soft">
                    {course.publishedLessonCount} of {course.lessonCount} published
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses === null && !loadError && <p className="py-6 text-ink-soft">Loading courses…</p>}
          {courses?.length === 0 && <p className="py-6 text-ink-soft">No courses yet. Create the first one above.</p>}
        </div>
      </section>
    </AdminLayout>
  )
}
