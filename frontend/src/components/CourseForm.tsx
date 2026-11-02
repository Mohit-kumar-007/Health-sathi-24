import { useId, useState, type FormEvent } from 'react'
import type { AdminCategory, ContentStatus, CourseInput } from '../lib/adminContent'

interface CourseFormProps {
  categories: AdminCategory[]
  initial?: CourseInput
  submitLabel: string
  // Returns an error message to show, or null when the save worked.
  onSubmit: (input: CourseInput) => Promise<string | null>
}

const inputClass =
  'mt-1.5 w-full rounded-xl border-2 border-pale bg-white px-4 py-2.5 text-base text-navy placeholder:text-sage focus:border-teal focus:outline-none'

export function CourseForm({ categories, initial, submitLabel, onSubmit }: CourseFormProps) {
  const uid = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '')
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? 'draft')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return
    if (!title.trim()) return setError('Enter a course title.')
    if (!description.trim()) return setError('Enter a short description.')
    if (!categoryId) return setError('Choose a category.')

    setError('')
    setIsSaved(false)
    setIsSaving(true)
    const message = await onSubmit({ title, description, categoryId, status })
    setIsSaving(false)
    if (message) setError(message)
    else setIsSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor={`${uid}-title`} className="text-sm font-bold text-navy">
            Course title
          </label>
          <input
            id={`${uid}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={150}
            className={inputClass}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`${uid}-description`} className="text-sm font-bold text-navy">
            Short description
          </label>
          <textarea
            id={`${uid}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            rows={3}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-ink-soft">Shown on the course card. {description.length} of 500 characters.</p>
        </div>
        <div>
          <label htmlFor={`${uid}-category`} className="text-sm font-bold text-navy">
            Category
          </label>
          <select
            id={`${uid}-category`}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={inputClass}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-status`} className="text-sm font-bold text-navy">
            Status
          </label>
          <select
            id={`${uid}-status`}
            value={status}
            onChange={(event) => setStatus(event.target.value as ContentStatus)}
            className={inputClass}
          >
            <option value="draft">Draft (hidden from learners)</option>
            <option value="published">Published</option>
            <option value="archived">Archived (hidden from learners)</option>
          </select>
        </div>
      </div>

      <div role="alert" className="min-h-6">
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
      </div>
      <div role="status" className="min-h-0">
        {isSaved && <p className="mt-2 text-sm font-bold text-primary-dark">Saved.</p>}
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 rounded-full bg-primary px-6 py-3 text-base font-bold text-white transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"
      >
        {isSaving ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
