import { Schema, model } from 'mongoose'

export const ICON_KEYS = ['prevention', 'body', 'mind', 'daily'] as const
export type IconKey = (typeof ICON_KEYS)[number]

export interface ICategory {
  name: string
  slug: string
  description: string
  iconKey: IconKey
  sortOrder: number
  status: 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    iconKey: { type: String, enum: [...ICON_KEYS], required: true },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'archived'], default: 'active', required: true },
  },
  { timestamps: true },
)

export const Category = model<ICategory>('Category', categorySchema)
