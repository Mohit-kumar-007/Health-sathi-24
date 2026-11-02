import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ORIGIN, startTestApp } from './helpers'

const PASSWORD = 'Learner-Pass-123'

type Status = 'draft' | 'published' | 'archived'
type Agent = ReturnType<typeof request.agent>

let ctx: Awaited<ReturnType<typeof startTestApp>>

beforeAll(async () => {
  ctx = await startTestApp()
})

afterAll(async () => {
  await ctx.stop()
})

beforeEach(async () => {
  await ctx.reset()
})

const videoId = (order: number) => `vid${String(order).padStart(2, '0')}abcdef`

async function loginLearner(loginId = 'learner1'): Promise<Agent> {
  await ctx.models.User.create({
    loginId,
    displayName: loginId,
    passwordHash: await ctx.hashPassword(PASSWORD),
    role: 'learner',
  })
  const agent = request.agent(ctx.app)
  const response = await agent.post('/api/auth/login').set('Origin', ORIGIN).send({ loginId, password: PASSWORD })
  expect(response.status).toBe(200)
  return agent
}

async function seedCourse(options: { courseStatus?: Status; categoryStatus?: 'active' | 'archived' } = {}) {
  const category = await ctx.models.Category.create({
    name: 'Mind',
    slug: 'mind',
    description: 'About mind',
    iconKey: 'mind',
    sortOrder: 1,
    status: options.categoryStatus ?? 'active',
  })
  const course = await ctx.models.Course.create({
    categoryId: category._id,
    title: 'Sleep Balance',
    slug: 'sleep-balance',
    description: 'About sleep',
    sortOrder: 1,
    status: options.courseStatus ?? 'published',
  })
  const addLesson = (title: string, order: number, status: Status = 'published') =>
    ctx.models.Lesson.create({
      courseId: course._id,
      title,
      notes: `Notes for ${title}`,
      youtubeVideoId: videoId(order),
      sortOrder: order,
      status,
    })
  return { course, addLesson }
}

const markComplete = (agent: Agent, lessonId: string, body: unknown = { completed: true }, origin = ORIGIN) =>
  agent.put(`/api/progress/${lessonId}`).set('Origin', origin).send(body as object)

describe('course page', () => {
  it('requires a login', async () => {
    await seedCourse()
    expect((await request(ctx.app).get('/api/courses/sleep-balance')).status).toBe(401)
  })

  it('lists published lessons in order, with the category, and without notes', async () => {
    const { addLesson } = await seedCourse()
    await addLesson('Second', 20)
    await addLesson('First', 10)
    await addLesson('Hidden draft', 30, 'draft')

    const learner = await loginLearner()
    const response = await learner.get('/api/courses/sleep-balance')

    expect(response.status).toBe(200)
    expect(response.body.course).toMatchObject({
      title: 'Sleep Balance',
      slug: 'sleep-balance',
      category: { name: 'Mind', slug: 'mind', iconKey: 'mind' },
    })
    expect(response.body.lessons.map((lesson: { title: string }) => lesson.title)).toEqual(['First', 'Second'])
    expect(JSON.stringify(response.body.lessons)).not.toContain('Notes for')
  })

  it.each([
    ['a draft course', { courseStatus: 'draft' as const }],
    ['a course in an archived category', { categoryStatus: 'archived' as const }],
  ])('hides %s', async (_label, options) => {
    await seedCourse(options)
    const learner = await loginLearner()
    expect((await learner.get('/api/courses/sleep-balance')).status).toBe(404)
  })

  it('returns 404 for an unknown course', async () => {
    const learner = await loginLearner()
    expect((await learner.get('/api/courses/nope')).status).toBe(404)
  })
})

describe('lesson page', () => {
  it('returns the notes, the video ID and the course', async () => {
    const { addLesson } = await seedCourse()
    const lesson = await addLesson('Calm evenings', 10)

    const learner = await loginLearner()
    const response = await learner.get(`/api/lessons/${lesson.id}`)

    expect(response.status).toBe(200)
    expect(response.body.lesson).toMatchObject({
      title: 'Calm evenings',
      notes: 'Notes for Calm evenings',
      youtubeVideoId: videoId(10),
      courseSlug: 'sleep-balance',
    })
  })

  it('hides draft lessons and lessons in draft courses', async () => {
    const { addLesson } = await seedCourse()
    const draft = await addLesson('Draft lesson', 10, 'draft')
    const learner = await loginLearner()
    expect((await learner.get(`/api/lessons/${draft.id}`)).status).toBe(404)

    await ctx.models.Course.updateOne({ slug: 'sleep-balance' }, { status: 'draft' })
    const published = await addLesson('Published lesson', 20)
    expect((await learner.get(`/api/lessons/${published.id}`)).status).toBe(404)
  })

  it('rejects a malformed ID and anonymous requests', async () => {
    const { addLesson } = await seedCourse()
    const lesson = await addLesson('Calm evenings', 10)
    const learner = await loginLearner()
    expect((await learner.get('/api/lessons/not-an-id')).status).toBe(400)
    expect((await request(ctx.app).get(`/api/lessons/${lesson.id}`)).status).toBe(401)
  })
})

describe('progress', () => {
  it('marks a lesson complete, lists it, and can undo it', async () => {
    const { addLesson } = await seedCourse()
    const lesson = await addLesson('Calm evenings', 10)
    const learner = await loginLearner()

    expect((await learner.get('/api/progress/me')).body.completed).toEqual([])

    expect((await markComplete(learner, lesson.id)).status).toBe(200)
    const listed = await learner.get('/api/progress/me')
    expect(listed.body.completed).toHaveLength(1)
    expect(listed.body.completed[0].lessonId).toBe(lesson.id)

    await markComplete(learner, lesson.id, { completed: false })
    expect((await learner.get('/api/progress/me')).body.completed).toEqual([])
  })

  it('can be marked twice without creating a duplicate', async () => {
    const { addLesson } = await seedCourse()
    const lesson = await addLesson('Calm evenings', 10)
    const learner = await loginLearner()

    await markComplete(learner, lesson.id)
    await markComplete(learner, lesson.id)

    expect(await ctx.models.Progress.countDocuments()).toBe(1)
  })

  it("keeps each learner's progress separate", async () => {
    const { addLesson } = await seedCourse()
    const lesson = await addLesson('Calm evenings', 10)
    const first = await loginLearner('learner1')
    const second = await loginLearner('learner2')

    await markComplete(first, lesson.id)

    expect((await first.get('/api/progress/me')).body.completed).toHaveLength(1)
    expect((await second.get('/api/progress/me')).body.completed).toEqual([])
  })

  it('does not record progress for a lesson learners cannot see', async () => {
    const { addLesson } = await seedCourse()
    const draft = await addLesson('Draft lesson', 10, 'draft')
    const learner = await loginLearner()

    expect((await markComplete(learner, draft.id)).status).toBe(404)
    expect(await ctx.models.Progress.countDocuments()).toBe(0)
  })

  it('drops a lesson from the list once it is unpublished', async () => {
    const { addLesson } = await seedCourse()
    const lesson = await addLesson('Calm evenings', 10)
    const learner = await loginLearner()
    await markComplete(learner, lesson.id)

    await ctx.models.Lesson.updateOne({ _id: lesson._id }, { status: 'draft' })

    expect((await learner.get('/api/progress/me')).body.completed).toEqual([])
  })

  it('validates the request and needs a login and the site origin', async () => {
    const { addLesson } = await seedCourse()
    const lesson = await addLesson('Calm evenings', 10)
    const learner = await loginLearner()

    expect((await markComplete(learner, lesson.id, { completed: 'yes' })).status).toBe(400)
    expect((await markComplete(learner, 'not-an-id')).status).toBe(400)
    expect((await markComplete(learner, lesson.id, { completed: true }, 'https://evil.example')).status).toBe(403)
    expect((await request(ctx.app).get('/api/progress/me')).status).toBe(401)
  })
})
