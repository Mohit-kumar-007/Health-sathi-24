import { Category } from '../models/Category'
import { Course } from '../models/Course'
import { Lesson } from '../models/Lesson'

// What a learner is allowed to see: a published course in an active category, and published lessons in it.
// Anything else behaves as if it does not exist. Callers must pass a valid ObjectId string for lesson IDs.

export async function findVisibleCourse(slug: string) {
  const course = await Course.findOne({ slug: slug.toLowerCase(), status: 'published' })
  if (!course) return null
  const category = await Category.findOne({ _id: course.categoryId, status: 'active' })
  return category ? { course, category } : null
}

export async function findVisibleLesson(lessonId: string) {
  const lesson = await Lesson.findOne({ _id: lessonId, status: 'published' })
  if (!lesson) return null
  const course = await Course.findOne({ _id: lesson.courseId, status: 'published' })
  if (!course) return null
  const category = await Category.findOne({ _id: course.categoryId, status: 'active' })
  return category ? { lesson, course, category } : null
}
