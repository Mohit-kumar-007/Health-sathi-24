import { Router } from 'express'
import { isValidObjectId, Types, type HydratedDocument } from 'mongoose'
import { z } from 'zod'
import { slugify } from '../lib/slug'
import { parseYoutubeId } from '../lib/youtube'
import { requireAdmin, requireAuth } from '../middleware/auth'
import { Category } from '../models/Category'
import { Chapter } from '../models/Chapter'
import { CONTENT_STATUSES, Course, type ICourse } from '../models/Course'
import { Lesson, type ILesson } from '../models/Lesson'
import { Progress } from '../models/Progress'

export const adminContentRouter = Router()
adminContentRouter.use(requireAuth, requireAdmin)

const SORT_STEP = 10
const BAD_VIDEO = "That doesn't look like a YouTube link or video ID."
const NEEDS_VIDEO = 'Add a valid YouTube link before publishing this lesson.'

const statusSchema = z.enum(CONTENT_STATUSES)
const objectId = z.string().refine((value) => isValidObjectId(value), 'Invalid ID.')

const courseFields = z.object({
  title: z.string().trim().min(1, 'Enter a course title.').max(150, 'The title is too long.'),
  description: z.string().trim().min(1, 'Enter a short description.').max(500, 'The description is too long.'),
  categoryId: objectId,
  status: statusSchema,
})
const createCourseBody = courseFields.extend({ status: statusSchema.default('draft') })
const updateCourseBody = courseFields.partial().refine((body) => Object.keys(body).length > 0, 'Nothing to update.')

const lessonFields = z.object({
  title: z.string().trim().min(1, 'Enter a lesson title.').max(150, 'The title is too long.'),
  video: z.string().trim().max(300, 'That link is too long.'),
  notes: z.string().max(20000, 'The notes are too long.'),
  status: statusSchema,
})
const createLessonBody = lessonFields.extend({
  video: lessonFields.shape.video.default(''),
  notes: lessonFields.shape.notes.default(''),
  status: statusSchema.default('draft'),
})
const updateLessonBody = lessonFields.partial().refine((body) => Object.keys(body).length > 0, 'Nothing to update.')

const reorderBody = z.object({ lessonIds: z.array(objectId).min(1).max(200) })

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid request.'
}

// '' clears the video, a valid link or ID gives the 11-character ID, anything else is undefined (invalid).
function readVideo(input: string): string | null | undefined {
  if (input === '') return null
  return parseYoutubeId(input) ?? undefined
}

function toAdminCourse(course: HydratedDocument<ICourse>) {
  return {
    id: course.id as string,
    title: course.title,
    slug: course.slug,
    description: course.description,
    categoryId: String(course.categoryId),
    status: course.status,
    sortOrder: course.sortOrder,
  }
}

function toAdminLesson(lesson: HydratedDocument<ILesson>) {
  return {
    id: lesson.id as string,
    title: lesson.title,
    youtubeVideoId: lesson.youtubeVideoId ?? null,
    notes: lesson.notes,
    status: lesson.status,
    sortOrder: lesson.sortOrder,
  }
}

async function uniqueCourseSlug(title: string): Promise<string> {
  const base = slugify(title) || 'course'
  let slug = base
  for (let n = 2; await Course.exists({ slug }); n += 1) slug = `${base}-${n}`
  return slug
}

function loadCourse(id: string) {
  return isValidObjectId(id) ? Course.findById(id) : null
}

function loadLesson(id: string) {
  return isValidObjectId(id) ? Lesson.findById(id) : null
}

adminContentRouter.get('/categories', async (_req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1 })
  res.json({
    categories: categories.map((category) => ({
      id: category.id as string,
      name: category.name,
      slug: category.slug,
      status: category.status,
    })),
  })
})

adminContentRouter.get('/courses', async (_req, res) => {
  const [courses, categories, counts] = await Promise.all([
    Course.find(),
    Category.find(),
    Lesson.aggregate<{ _id: Types.ObjectId; total: number; published: number }>([
      {
        $group: {
          _id: '$courseId',
          total: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        },
      },
    ]),
  ])
  const categoryById = new Map(categories.map((category) => [category.id as string, category]))
  const countByCourse = new Map(counts.map((count) => [String(count._id), count]))

  const rows = courses
    .map((course) => {
      const category = categoryById.get(String(course.categoryId))
      const count = countByCourse.get(course.id as string)
      return {
        ...toAdminCourse(course),
        categoryName: category?.name ?? 'Unknown',
        categoryOrder: category?.sortOrder ?? 0,
        lessonCount: count?.total ?? 0,
        publishedLessonCount: count?.published ?? 0,
      }
    })
    .sort((a, b) => a.categoryOrder - b.categoryOrder || a.sortOrder - b.sortOrder)

  res.json({ courses: rows })
})

adminContentRouter.post('/courses', async (req, res) => {
  const body = createCourseBody.safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: firstIssue(body.error) })
  if (!(await Category.exists({ _id: body.data.categoryId }))) {
    return res.status(400).json({ error: 'Choose a valid category.' })
  }

  const last = await Course.findOne({ categoryId: body.data.categoryId }).sort({ sortOrder: -1 })
  const course = await Course.create({
    ...body.data,
    categoryId: new Types.ObjectId(body.data.categoryId),
    slug: await uniqueCourseSlug(body.data.title),
    sortOrder: (last?.sortOrder ?? 0) + SORT_STEP,
    createdBy: res.locals.user._id,
    updatedBy: res.locals.user._id,
  })
  res.status(201).json({ course: toAdminCourse(course) })
})

adminContentRouter.get('/courses/:id', async (req, res) => {
  const course = await loadCourse(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found.' })
  const lessons = await Lesson.find({ courseId: course._id }).sort({ sortOrder: 1, _id: 1 })
  res.json({ course: toAdminCourse(course), lessons: lessons.map(toAdminLesson) })
})

adminContentRouter.patch('/courses/:id', async (req, res) => {
  const course = await loadCourse(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found.' })
  const body = updateCourseBody.safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: firstIssue(body.error) })
  if (body.data.categoryId && !(await Category.exists({ _id: body.data.categoryId }))) {
    return res.status(400).json({ error: 'Choose a valid category.' })
  }

  // The slug is left alone on purpose, so links to the course keep working after a rename.
  course.set({ ...body.data, updatedBy: res.locals.user._id })
  await course.save()
  res.json({ course: toAdminCourse(course) })
})

adminContentRouter.delete('/courses/:id', async (req, res) => {
  const course = await loadCourse(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found.' })
  await Promise.all([
    Lesson.deleteMany({ courseId: course._id }),
    Chapter.deleteMany({ courseId: course._id }),
    Progress.deleteMany({ courseId: course._id }),
  ])
  await course.deleteOne()
  res.status(204).end()
})

adminContentRouter.post('/courses/:id/lessons', async (req, res) => {
  const course = await loadCourse(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found.' })
  const body = createLessonBody.safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: firstIssue(body.error) })

  const videoId = readVideo(body.data.video)
  if (videoId === undefined) return res.status(400).json({ error: BAD_VIDEO })
  if (body.data.status === 'published' && !videoId) return res.status(400).json({ error: NEEDS_VIDEO })

  const last = await Lesson.findOne({ courseId: course._id }).sort({ sortOrder: -1 })
  const lesson = await Lesson.create({
    courseId: course._id,
    title: body.data.title,
    notes: body.data.notes,
    youtubeVideoId: videoId ?? undefined,
    status: body.data.status,
    sortOrder: (last?.sortOrder ?? 0) + SORT_STEP,
    updatedBy: res.locals.user._id,
  })
  res.status(201).json({ lesson: toAdminLesson(lesson) })
})

adminContentRouter.post('/courses/:id/lessons/reorder', async (req, res) => {
  const course = await loadCourse(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found.' })
  const body = reorderBody.safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: 'Send the lesson IDs in the new order.' })

  const lessons = await Lesson.find({ courseId: course._id }).select('_id')
  const existing = new Set(lessons.map((lesson) => String(lesson._id)))
  const requested = body.data.lessonIds
  const isSameSet =
    requested.length === existing.size &&
    new Set(requested).size === requested.length &&
    requested.every((id) => existing.has(id))
  if (!isSameSet) return res.status(400).json({ error: 'The lesson list is out of date. Reload and try again.' })

  await Lesson.bulkWrite(
    requested.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { sortOrder: (index + 1) * SORT_STEP } } },
    })),
  )
  res.status(204).end()
})

adminContentRouter.patch('/lessons/:id', async (req, res) => {
  const lesson = await loadLesson(req.params.id)
  if (!lesson) return res.status(404).json({ error: 'Lesson not found.' })
  const body = updateLessonBody.safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: firstIssue(body.error) })

  let videoId: string | null | undefined = lesson.youtubeVideoId ?? null
  if (body.data.video !== undefined) {
    videoId = readVideo(body.data.video)
    if (videoId === undefined) return res.status(400).json({ error: BAD_VIDEO })
  }
  const status = body.data.status ?? lesson.status
  if (status === 'published' && !videoId) return res.status(400).json({ error: NEEDS_VIDEO })

  if (body.data.title !== undefined) lesson.title = body.data.title
  if (body.data.notes !== undefined) lesson.notes = body.data.notes
  lesson.status = status
  lesson.youtubeVideoId = videoId ?? undefined
  lesson.updatedBy = res.locals.user._id
  await lesson.save()
  res.json({ lesson: toAdminLesson(lesson) })
})

adminContentRouter.delete('/lessons/:id', async (req, res) => {
  const lesson = await loadLesson(req.params.id)
  if (!lesson) return res.status(404).json({ error: 'Lesson not found.' })
  await Progress.deleteMany({ lessonId: lesson._id })
  await lesson.deleteOne()
  res.status(204).end()
})
