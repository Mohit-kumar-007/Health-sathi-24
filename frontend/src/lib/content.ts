import { api } from './api'

export type IconKey = 'prevention' | 'body' | 'mind' | 'daily'

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  iconKey: IconKey
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string
  thumbnailRef: string | null
  categoryId: string
  lessonCount: number
}

export function listCategories() {
  return api<{ categories: Category[] }>('/api/categories')
}

export function listCourses(categorySlug: string) {
  return api<{ courses: Course[] }>(`/api/courses?category=${encodeURIComponent(categorySlug)}`)
}
