import { Router } from 'express'
import type { Types } from 'mongoose'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { Category } from '../models/Category'
import { Course } from '../models/Course'
import { Lesson } from '../models/Lesson'

export const contentRouter = Router()

const coursesQuery = z.object({ category: z.string().trim().min(1).max(100).optional() })

// Learners only ever see active categories and published courses; drafts and archived items stay hidden.
contentRouter.get('/categories', requireAuth, async (_req, res) => {
  const categories = await Category.find({ status: 'active' }).sort({ sortOrder: 1 })
  res.json({
    categories: categories.map((category) => ({
      id: category.id as string,
      name: category.name,
      slug: category.slug,
      description: category.description,
      iconKey: category.iconKey,
    })),
  })
})

contentRouter.get('/courses', requireAuth, async (req, res) => {
  const query = coursesQuery.safeParse(req.query)
  if (!query.success) return res.status(400).json({ error: 'Invalid category.' })

  const categories = await Category.find({
    status: 'active',
    ...(query.data.category ? { slug: query.data.category.toLowerCase() } : {}),
  })
  const courses = await Course.find({
    status: 'published',
    categoryId: { $in: categories.map((category) => category._id) },
  }).sort({ sortOrder: 1 })

  const counts = await Lesson.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { status: 'published', courseId: { $in: courses.map((course) => course._id) } } },
    { $group: { _id: '$courseId', count: { $sum: 1 } } },
  ])
  const lessonCounts = new Map(counts.map((entry) => [String(entry._id), entry.count]))

  res.json({
    courses: courses.map((course) => ({
      id: course.id as string,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnailRef: course.thumbnailRef ?? null,
      categoryId: String(course.categoryId),
      lessonCount: lessonCounts.get(course.id as string) ?? 0,
    })),
  })
})
