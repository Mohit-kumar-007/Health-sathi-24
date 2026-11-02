import { Router } from 'express'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import { findVisibleLesson } from '../lib/visibility'
import { requireAuth } from '../middleware/auth'
import { Lesson } from '../models/Lesson'
import { Progress } from '../models/Progress'

export const progressRouter = Router()

const updateBody = z.object({ completed: z.boolean() })

// The learner always comes from the session, never from the request, so one learner can't read or change another's progress.
progressRouter.get('/me', requireAuth, async (_req, res) => {
  const rows = await Progress.find({ userId: res.locals.user._id })
  const published = await Lesson.find({
    _id: { $in: rows.map((row) => row.lessonId) },
    status: 'published',
  }).select('_id')
  const visibleIds = new Set(published.map((lesson) => String(lesson._id)))

  res.json({
    completed: rows
      .filter((row) => visibleIds.has(String(row.lessonId)))
      .map((row) => ({ lessonId: String(row.lessonId), courseId: String(row.courseId) })),
  })
})

progressRouter.put('/:lessonId', requireAuth, async (req, res) => {
  const lessonId = String(req.params.lessonId)
  if (!isValidObjectId(lessonId)) return res.status(400).json({ error: 'Invalid lesson.' })
  const body = updateBody.safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: 'Send { "completed": true } or { "completed": false }.' })

  const found = await findVisibleLesson(lessonId)
  if (!found) return res.status(404).json({ error: 'Lesson not found.' })

  const filter = { userId: res.locals.user._id, lessonId: found.lesson._id }
  if (body.data.completed) {
    await Progress.updateOne(
      filter,
      { $setOnInsert: { courseId: found.course._id, completedAt: new Date() } },
      { upsert: true },
    )
  } else {
    await Progress.deleteOne(filter)
  }
  res.json({ completed: body.data.completed })
})
