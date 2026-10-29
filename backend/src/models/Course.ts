import { Schema, model, type Types } from 'mongoose'

export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export interface ICourse {
  categoryId: Types.ObjectId
  title: string
  slug: string
  description: string
  thumbnailRef?: string
  sortOrder: number
  status: ContentStatus
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const courseSchema = new Schema<ICourse>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    thumbnailRef: { type: String, trim: true, maxlength: 300 },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: [...CONTENT_STATUSES], default: 'draft', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

courseSchema.index({ categoryId: 1, status: 1, sortOrder: 1 })

export const Course = model<ICourse>('Course', courseSchema)
