import { useId, useState, type FormEvent } from 'react'
import type { AdminLesson, ContentStatus, LessonInput } from '../lib/adminContent'
import { parseYoutubeId } from '../lib/youtube'
import { Markdown } from './Markdown'
import { VideoPlayer } from './VideoPlayer'

interface LessonEditorProps {
  initial?: AdminLesson
  // Returns an error message to show, or null when the save worked.
  onSave: (input: LessonInput) => Promise<string | null>
  onCancel: () => void
}

const inputClass =
  'mt-1.5 w-full rounded-xl border-2 border-pale bg-white px-4 py-2.5 text-base text-navy placeholder:text-sage focus:border-teal focus:outline-none'

export function LessonEditor({ initial, onSave, onCancel }: LessonEditorProps) {
  const uid = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [video, setVideo] = useState(initial?.youtubeVideoId ? `https://youtu.be/${initial.youtubeVideoId}` : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? 'draft')
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const trimmedVideo = video.trim()
  const videoId = trimmedVideo ? parseYoutubeId(trimmedVideo) : null
  const isVideoInvalid = trimmedVideo !== '' && videoId === null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return
    if (!title.trim()) return setError('Enter a lesson title.')
    if (isVideoInvalid) return setError("That doesn't look like a YouTube link or video ID.")
    if (status === 'published' && !videoId) return setError('Add a valid YouTube link before publishing this lesson.')

    setError('')
    setIsSaving(true)
    const message = await onSave({ title, video: trimmedVideo, notes, status })
    setIsSaving(false)
    if (message) setError(message)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border-2 border-teal/40 bg-white p-5">
      <h3 className="text-lg font-extrabold text-navy">{initial ? 'Edit lesson' : 'New lesson'}</h3>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor={`${uid}-title`} className="text-sm font-bold text-navy">
            Lesson title
          </label>
          <input
            id={`${uid}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={150}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={`${uid}-video`} className="text-sm font-bold text-navy">
            YouTube link or video ID
          </label>
          <input
            id={`${uid}-video`}
            value={video}
            onChange={(event) => setVideo(event.target.value)}
            maxLength={300}
            spellCheck={false}
            placeholder="https://youtu.be/..."
            aria-describedby={`${uid}-video-hint`}
            className={inputClass}
          />
          <p
            id={`${uid}-video-hint`}
            className={`mt-1 text-xs ${isVideoInvalid ? 'font-bold text-red-800' : videoId ? 'font-bold text-primary-dark' : 'text-ink-soft'}`}
          >
            {isVideoInvalid
              ? "That doesn't look like a YouTube link."
              : videoId
                ? `Video found (${videoId}).`
                : 'Paste a YouTube link. You can leave it empty while the lesson is a draft.'}
          </p>
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

        <div className="md:col-span-2">
          <label htmlFor={`${uid}-notes`} className="text-sm font-bold text-navy">
            Notes (shown under the video)
          </label>
          <textarea
            id={`${uid}-notes`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={20000}
            rows={10}
            aria-describedby={`${uid}-notes-hint`}
            className={`${inputClass} font-mono text-sm`}
          />
          <p id={`${uid}-notes-hint`} className="mt-1 text-xs text-ink-soft">
            Leave a blank line between paragraphs. Start a line with "- " for a bullet. Use **bold**, *italic* and [text](https://link).
            Raw HTML is not used.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowPreview((shown) => !shown)}
        aria-expanded={showPreview}
        className="mt-4 text-sm font-bold text-teal-text underline"
      >
        {showPreview ? 'Hide preview' : 'Preview as a learner'}
      </button>

      {showPreview && (
        <div className="mt-3 rounded-2xl border border-pale bg-ivory p-4">
          <VideoPlayer videoId={videoId} title={title || 'Lesson video'} />
          <h4 className="mt-4 text-xl font-extrabold text-navy">{title || 'Untitled lesson'}</h4>
          <div className="mt-3 text-ink-soft">
            <Markdown source={notes} />
          </div>
        </div>
      )}

      <div role="alert" className="min-h-6">
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"
        >
          {isSaving ? 'Saving…' : 'Save lesson'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border-2 border-navy/15 px-6 py-2.5 text-sm font-bold text-navy hover:border-navy/40"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
