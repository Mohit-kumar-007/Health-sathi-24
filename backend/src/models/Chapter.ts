import { Schema, model, type Types } from 'mongoose'
import { CONTENT_STATUSES, type ContentStatus } from './Course'

export interface IChapter {
  courseId: Types.ObjectId
  title: string
  description?: string
  sortOrder: number
  status: ContentStatus
  createdAt: Date
  updatedAt: Date
}

const chapterSchema = new Schema<IChapter>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: [...CONTENT_STATUSES], default: 'draft', required: true },
  },
  { timestamps: true },
)

chapterSchema.index({ courseId: 1, sortOrder: 1 })

export const Chapter = model<IChapter>('Chapter', chapterSchema)
