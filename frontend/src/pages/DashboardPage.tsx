import { useEffect, useState } from 'react'
import { CourseCard } from '../components/CourseCard'
import { LearnerHeader } from '../components/LearnerHeader'
import { listCategories, listCourses, type Category, type Course } from '../lib/content'
import { useCurrentUser } from '../lib/useCurrentUser'

function redirectIfSignedOut(status: number): boolean {
  if (status !== 401) return false
  window.location.replace('/login')
  return true
}

function Courses({ displayName }: { displayName: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listCategories().then((result) => {
      if (redirectIfSignedOut(result.status)) return
      if (!result.ok || !result.data) return setError(result.error)
      setCategories(result.data.categories)
      setSelectedSlug(result.data.categories[0]?.slug ?? '')
    })
  }, [])

  useEffect(() => {
    if (!selectedSlug) return
    let isActive = true
    setCourses(null)
    listCourses(selectedSlug).then((result) => {
      if (!isActive || redirectIfSignedOut(result.status)) return
      if (!result.ok || !result.data) return setError(result.error)
      setError('')
      setCourses(result.data.courses)
    })
    return () => {
      isActive = false
    }
  }, [selectedSlug])

  const selected = categories.find((category) => category.slug === selectedSlug)

  return (
    <div className="min-h-screen bg-ivory">
      <LearnerHeader displayName={displayName} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Hello, {displayName}</h1>
        <p className="mt-2 text-lg text-ink-soft">Pick a topic to see its courses.</p>

        {categories.length > 0 && (
          <div role="group" aria-label="Topics" className="mt-8 flex flex-wrap gap-3">
            {categories.map((category) => {
              const isSelected = category.slug === selectedSlug
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedSlug(category.slug)}
                  className={`rounded-full border-2 px-5 py-2.5 text-sm font-bold transition ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-pale bg-white text-navy hover:border-sage'
                  }`}
                >
                  {category.name}
                </button>
              )
            })}
          </div>
        )}

        {selected && <p className="mt-4 text-ink-soft">{selected.description}</p>}

        <div role="alert">
          {error && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
        </div>

        {courses === null && selectedSlug && !error && <p className="mt-8 text-ink-soft">Loading courses…</p>}
        {courses?.length === 0 && <p className="mt-8 text-ink-soft">No courses in this topic yet.</p>}
        {selected && courses && courses.length > 0 && (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <li key={course.id} className="flex">
                <div className="flex w-full">
                  <CourseCard course={course} iconKey={selected.iconKey} categoryName={selected.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {!error && categories.length === 0 && selectedSlug === '' && courses === null && (
          <p className="mt-8 text-ink-soft">Topics will appear here once they are added.</p>
        )}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  const current = useCurrentUser()

  useEffect(() => {
    document.title = 'Dashboard | HealthSathi24'
    if (current.status !== 'ready') return
    if (current.user.role === 'admin') window.location.replace('/admin/users')
  }, [current])

  if (current.status === 'loading') return <p className="p-8 text-ink-soft">Loading…</p>
  if (current.status === 'error') {
    return (
      <p role="alert" className="p-8 text-red-800">
        {current.message}
      </p>
    )
  }
  if (current.user.role === 'admin') return null

  return <Courses displayName={current.user.displayName} />
}
