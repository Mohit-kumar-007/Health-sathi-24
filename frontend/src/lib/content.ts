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

export interface CourseDetail {
  id: string
  title: string
  slug: string
  description: string
  category: { name: string; slug: string; iconKey: IconKey }
}

export interface LessonSummary {
  id: string
  title: string
}

export interface LessonDetail {
  id: string
  title: string
  notes: string
  youtubeVideoId: string | null
  courseId: string
  courseSlug: string
}

export interface CompletedLesson {
  lessonId: string
  courseId: string
}

export function getCourse(slug: string) {
  return api<{ course: CourseDetail; lessons: LessonSummary[] }>(`/api/courses/${encodeURIComponent(slug)}`)
}

export function getLesson(id: string) {
  return api<{ lesson: LessonDetail }>(`/api/lessons/${encodeURIComponent(id)}`)
}

export function listProgress() {
  return api<{ completed: CompletedLesson[] }>('/api/progress/me')
}

export function setLessonCompleted(lessonId: string, completed: boolean) {
  return api<{ completed: boolean }>(`/api/progress/${encodeURIComponent(lessonId)}`, {
    method: 'PUT',
    body: { completed },
  })
}
