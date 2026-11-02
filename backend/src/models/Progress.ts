import { Schema, model, type Types } from 'mongoose'

export interface IProgress {
  userId: Types.ObjectId
  courseId: Types.ObjectId
  lessonId: Types.ObjectId
  completedAt: Date
  createdAt: Date
  updatedAt: Date
}

const progressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    completedAt: { type: Date, required: true },
  },
  { timestamps: true },
)

// One record per learner per lesson; the unique index also makes "mark complete" safe to repeat.
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true })
progressSchema.index({ userId: 1, courseId: 1 })

export const Progress = model<IProgress>('Progress', progressSchema)
