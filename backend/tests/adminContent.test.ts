import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ORIGIN, startTestApp } from './helpers'

const PASSWORD = 'Some-Pass-12345'
const VIDEO = 'dQw4w9WgXcQ'

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

async function login(role: 'admin' | 'learner'): Promise<Agent> {
  await ctx.models.User.create({
    loginId: role,
    displayName: role,
    passwordHash: await ctx.hashPassword(PASSWORD),
    role,
  })
  const agent = request.agent(ctx.app)
  const response = await agent.post('/api/auth/login').set('Origin', ORIGIN).send({ loginId: role, password: PASSWORD })
  expect(response.status).toBe(200)
  return agent
}

async function seedCategory() {
  return ctx.models.Category.create({ name: 'Mind', slug: 'mind', description: 'About mind', iconKey: 'mind', sortOrder: 1 })
}

const send = (agent: Agent, method: 'post' | 'patch' | 'delete', path: string, body?: object) =>
  agent[method](path).set('Origin', ORIGIN).send(body)

async function createCourse(admin: Agent, categoryId: string, title = 'Sleep Balance') {
  const response = await send(admin, 'post', '/api/admin/courses', { title, description: 'About sleep', categoryId })
  expect(response.status).toBe(201)
  return response.body.course as { id: string; slug: string; status: string }
}

async function createLesson(admin: Agent, courseId: string, body: object = {}) {
  return send(admin, 'post', `/api/admin/courses/${courseId}/lessons`, { title: 'Calm evenings', video: VIDEO, ...body })
}

describe('access', () => {
  it('blocks anonymous users and learners from every content route', async () => {
    const category = await seedCategory()
    const learner = await login('learner')

    expect((await request(ctx.app).get('/api/admin/courses')).status).toBe(401)
    expect((await learner.get('/api/admin/courses')).status).toBe(403)
    expect((await send(learner, 'post', '/api/admin/courses', { title: 'X', description: 'Y', categoryId: category.id })).status).toBe(403)
    expect((await learner.get('/api/admin/categories')).status).toBe(403)
  })
})

describe('courses', () => {
  it('creates a draft with a readable slug, and numbers repeated titles', async () => {
    const category = await seedCategory()
    const admin = await login('admin')

    const first = await createCourse(admin, category.id)
    const second = await createCourse(admin, category.id)

    expect(first).toMatchObject({ slug: 'sleep-balance', status: 'draft' })
    expect(second.slug).toBe('sleep-balance-2')
  })

  it('rejects an empty title and an unknown category', async () => {
    const category = await seedCategory()
    const admin = await login('admin')

    const emptyTitle = await send(admin, 'post', '/api/admin/courses', { title: ' ', description: 'About', categoryId: category.id })
    const badCategory = await send(admin, 'post', '/api/admin/courses', {
      title: 'Sleep',
      description: 'About',
      categoryId: '64b000000000000000000000',
    })
    expect(emptyTitle.status).toBe(400)
    expect(badCategory.status).toBe(400)
  })

  it('stays hidden from learners until it is published', async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const learner = await login('learner')
    const course = await createCourse(admin, category.id)

    expect((await learner.get('/api/courses?category=mind')).body.courses).toEqual([])

    const published = await send(admin, 'patch', `/api/admin/courses/${course.id}`, { status: 'published' })
    expect(published.status).toBe(200)
    expect((await learner.get('/api/courses?category=mind')).body.courses).toHaveLength(1)
  })

  it('keeps the slug when the title changes', async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const course = await createCourse(admin, category.id)

    const renamed = await send(admin, 'patch', `/api/admin/courses/${course.id}`, { title: 'Better Sleep' })

    expect(renamed.body.course).toMatchObject({ title: 'Better Sleep', slug: 'sleep-balance' })
  })

  it('lists every course with lesson counts, drafts included', async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const course = await createCourse(admin, category.id)
    await createLesson(admin, course.id, { status: 'published' })
    await createLesson(admin, course.id, { video: '' })

    const listed = await admin.get('/api/admin/courses')

    expect(listed.body.courses[0]).toMatchObject({
      title: 'Sleep Balance',
      categoryName: 'Mind',
      lessonCount: 2,
      publishedLessonCount: 1,
    })
  })

  it('deletes a course together with its lessons and progress', async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const learner = await login('learner')
    const course = await createCourse(admin, category.id)
    await send(admin, 'patch', `/api/admin/courses/${course.id}`, { status: 'published' })
    const lesson = await createLesson(admin, course.id, { status: 'published' })
    await learner.put(`/api/progress/${lesson.body.lesson.id}`).set('Origin', ORIGIN).send({ completed: true })
    expect(await ctx.models.Progress.countDocuments()).toBe(1)

    const removed = await send(admin, 'delete', `/api/admin/courses/${course.id}`)

    expect(removed.status).toBe(204)
    expect(await ctx.models.Lesson.countDocuments()).toBe(0)
    expect(await ctx.models.Progress.countDocuments()).toBe(0)
    expect((await admin.get(`/api/admin/courses/${course.id}`)).status).toBe(404)
  })
})

describe('accounts', () => {
  it("deletes a learner's progress along with their account", async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const learner = await login('learner')
    const course = await createCourse(admin, category.id)
    await send(admin, 'patch', `/api/admin/courses/${course.id}`, { status: 'published' })
    const lesson = await createLesson(admin, course.id, { status: 'published' })
    await learner.put(`/api/progress/${lesson.body.lesson.id}`).set('Origin', ORIGIN).send({ completed: true })
    expect(await ctx.models.Progress.countDocuments()).toBe(1)

    const learnerId = (await ctx.models.User.findOne({ loginId: 'learner' }))?.id as string
    const removed = await send(admin, 'delete', `/api/admin/users/${learnerId}`)

    expect(removed.status).toBe(204)
    expect(await ctx.models.Progress.countDocuments()).toBe(0)
  })
})

describe('lessons', () => {
  it.each([
    ['a youtu.be link', `https://youtu.be/${VIDEO}`],
    ['a watch link with extras', `https://www.youtube.com/watch?v=${VIDEO}&t=5s`],
    ['an embed link', `https://www.youtube.com/embed/${VIDEO}`],
    ['a bare video ID', VIDEO],
  ])('stores only the video ID from %s', async (_label, video) => {
    const category = await seedCategory()
    const admin = await login('admin')
    const course = await createCourse(admin, category.id)

    const response = await createLesson(admin, course.id, { video })

    expect(response.status).toBe(201)
    expect(response.body.lesson.youtubeVideoId).toBe(VIDEO)
  })

  it.each([
    ['another website', `https://evil.example/watch?v=${VIDEO}`],
    ['a script link', 'javascript:alert(1)'],
    ['plain text', 'not a link'],
  ])('rejects %s as a video', async (_label, video) => {
    const category = await seedCategory()
    const admin = await login('admin')
    const course = await createCourse(admin, category.id)

    expect((await createLesson(admin, course.id, { video })).status).toBe(400)
  })

  it('will not publish a lesson without a video, but will save it as a draft', async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const course = await createCourse(admin, category.id)

    expect((await createLesson(admin, course.id, { video: '', status: 'published' })).status).toBe(400)
    const draft = await createLesson(admin, course.id, { video: '' })
    expect(draft.status).toBe(201)

    const publish = await send(admin, 'patch', `/api/admin/lessons/${draft.body.lesson.id}`, { status: 'published' })
    expect(publish.status).toBe(400)
    const withVideo = await send(admin, 'patch', `/api/admin/lessons/${draft.body.lesson.id}`, {
      status: 'published',
      video: VIDEO,
    })
    expect(withVideo.status).toBe(200)
  })

  it('does not touch the video when only the notes change', async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const course = await createCourse(admin, category.id)
    const lesson = await createLesson(admin, course.id)

    const updated = await send(admin, 'patch', `/api/admin/lessons/${lesson.body.lesson.id}`, { notes: 'New notes' })

    expect(updated.body.lesson).toMatchObject({ notes: 'New notes', youtubeVideoId: VIDEO })
  })

  it('rejects notes that are too long', async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const course = await createCourse(admin, category.id)

    expect((await createLesson(admin, course.id, { notes: 'x'.repeat(20001) })).status).toBe(400)
  })

  it('shows learners an edited lesson straight away', async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const learner = await login('learner')
    const course = await createCourse(admin, category.id)
    await send(admin, 'patch', `/api/admin/courses/${course.id}`, { status: 'published' })
    const lesson = await createLesson(admin, course.id, { status: 'published' })

    await send(admin, 'patch', `/api/admin/lessons/${lesson.body.lesson.id}`, { title: 'Renamed lesson' })

    const seen = await learner.get(`/api/lessons/${lesson.body.lesson.id}`)
    expect(seen.body.lesson.title).toBe('Renamed lesson')
  })

  it('reorders lessons, and refuses an out-of-date list', async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const course = await createCourse(admin, category.id)
    const a = (await createLesson(admin, course.id, { title: 'A' })).body.lesson.id as string
    const b = (await createLesson(admin, course.id, { title: 'B' })).body.lesson.id as string
    const c = (await createLesson(admin, course.id, { title: 'C' })).body.lesson.id as string

    const reorder = await send(admin, 'post', `/api/admin/courses/${course.id}/lessons/reorder`, { lessonIds: [c, a, b] })
    expect(reorder.status).toBe(204)
    const detail = await admin.get(`/api/admin/courses/${course.id}`)
    expect(detail.body.lessons.map((lesson: { title: string }) => lesson.title)).toEqual(['C', 'A', 'B'])

    const missing = await send(admin, 'post', `/api/admin/courses/${course.id}/lessons/reorder`, { lessonIds: [a, b] })
    const duplicate = await send(admin, 'post', `/api/admin/courses/${course.id}/lessons/reorder`, { lessonIds: [a, a, b] })
    expect(missing.status).toBe(400)
    expect(duplicate.status).toBe(400)
  })

  it("deletes a lesson and everyone's progress on it", async () => {
    const category = await seedCategory()
    const admin = await login('admin')
    const learner = await login('learner')
    const course = await createCourse(admin, category.id)
    await send(admin, 'patch', `/api/admin/courses/${course.id}`, { status: 'published' })
    const lesson = await createLesson(admin, course.id, { status: 'published' })
    await learner.put(`/api/progress/${lesson.body.lesson.id}`).set('Origin', ORIGIN).send({ completed: true })

    const removed = await send(admin, 'delete', `/api/admin/lessons/${lesson.body.lesson.id}`)

    expect(removed.status).toBe(204)
    expect(await ctx.models.Progress.countDocuments()).toBe(0)
    expect((await learner.get(`/api/lessons/${lesson.body.lesson.id}`)).status).toBe(404)
  })
})
