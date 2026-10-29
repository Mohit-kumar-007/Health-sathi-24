import { Schema, model, type Types } from 'mongoose'
import { CONTENT_STATUSES, type ContentStatus } from './Course'

export interface ILesson {
  courseId: Types.ObjectId
  chapterId: Types.ObjectId
  title: string
  summary?: string
  youtubeVideoId?: string
  notes: string
  durationMinutes?: number
  sortOrder: number
  status: ContentStatus
  updatedBy?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const lessonSchema = new Schema<ILesson>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    summary: { type: String, trim: true, maxlength: 500 },
    // A bare video ID, never a URL: the admin form will extract it so the player only embeds known-shaped IDs.
    youtubeVideoId: { type: String, trim: true, match: /^[\w-]{11}$/ },
    notes: { type: String, default: '', maxlength: 20000 },
    durationMinutes: { type: Number, min: 0, max: 600 },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: [...CONTENT_STATUSES], default: 'draft', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

lessonSchema.index({ courseId: 1, status: 1, sortOrder: 1 })

export const Lesson = model<ILesson>('Lesson', lessonSchema)
