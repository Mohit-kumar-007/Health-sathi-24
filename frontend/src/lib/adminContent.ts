import { api } from './api'

export type ContentStatus = 'draft' | 'published' | 'archived'

export interface AdminCategory {
  id: string
  name: string
  slug: string
  status: 'active' | 'archived'
}

export interface AdminCourse {
  id: string
  title: string
  slug: string
  description: string
  categoryId: string
  status: ContentStatus
  sortOrder: number
}

export interface AdminCourseRow extends AdminCourse {
  categoryName: string
  lessonCount: number
  publishedLessonCount: number
}

export interface AdminLesson {
  id: string
  title: string
  youtubeVideoId: string | null
  notes: string
  status: ContentStatus
  sortOrder: number
}

export interface CourseInput {
  title: string
  description: string
  categoryId: string
  status: ContentStatus
}

// `video` is whatever the admin pasted: a YouTube link or a bare video ID. The server extracts the ID.
export interface LessonInput {
  title: string
  video: string
  notes: string
  status: ContentStatus
}

export function listAdminCategories() {
  return api<{ categories: AdminCategory[] }>('/api/admin/categories')
}

export function listAdminCourses() {
  return api<{ courses: AdminCourseRow[] }>('/api/admin/courses')
}

export function createCourse(input: CourseInput) {
  return api<{ course: AdminCourse }>('/api/admin/courses', { method: 'POST', body: input })
}

export function getAdminCourse(id: string) {
  return api<{ course: AdminCourse; lessons: AdminLesson[] }>(`/api/admin/courses/${encodeURIComponent(id)}`)
}

export function updateCourse(id: string, input: CourseInput) {
  return api<{ course: AdminCourse }>(`/api/admin/courses/${encodeURIComponent(id)}`, { method: 'PATCH', body: input })
}

export function deleteCourse(id: string) {
  return api<null>(`/api/admin/courses/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function createLesson(courseId: string, input: LessonInput) {
  return api<{ lesson: AdminLesson }>(`/api/admin/courses/${encodeURIComponent(courseId)}/lessons`, {
    method: 'POST',
    body: input,
  })
}

export function updateLesson(id: string, input: LessonInput) {
  return api<{ lesson: AdminLesson }>(`/api/admin/lessons/${encodeURIComponent(id)}`, { method: 'PATCH', body: input })
}

export function deleteLesson(id: string) {
  return api<null>(`/api/admin/lessons/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function reorderLessons(courseId: string, lessonIds: string[]) {
  return api<null>(`/api/admin/courses/${encodeURIComponent(courseId)}/lessons/reorder`, {
    method: 'POST',
    body: { lessonIds },
  })
}
