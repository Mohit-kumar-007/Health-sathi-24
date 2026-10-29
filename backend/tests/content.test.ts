import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Types } from 'mongoose'
import request from 'supertest'
import { ORIGIN, startTestApp } from './helpers'

const PASSWORD = 'Learner-Pass-123'

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

async function loginLearner() {
  await ctx.models.User.create({
    loginId: 'learner1',
    displayName: 'Learner One',
    passwordHash: await ctx.hashPassword(PASSWORD),
    role: 'learner',
  })
  const agent = request.agent(ctx.app)
  const response = await agent.post('/api/auth/login').set('Origin', ORIGIN).send({ loginId: 'learner1', password: PASSWORD })
  expect(response.status).toBe(200)
  return agent
}

async function addCategory(slug: string, sortOrder: number, status: 'active' | 'archived' = 'active') {
  return ctx.models.Category.create({ name: slug, slug, description: `About ${slug}`, iconKey: 'mind', sortOrder, status })
}

async function addCourse(
  categoryId: Types.ObjectId,
  slug: string,
  status: 'draft' | 'published' | 'archived' = 'published',
  sortOrder = 1,
) {
  return ctx.models.Course.create({ categoryId, title: slug, slug, description: `About ${slug}`, sortOrder, status })
}

describe('content access', () => {
  it('requires a login', async () => {
    expect((await request(ctx.app).get('/api/categories')).status).toBe(401)
    expect((await request(ctx.app).get('/api/courses')).status).toBe(401)
  })

  it('lets a logged-in learner read content straight away', async () => {
    const learner = await loginLearner()
    expect((await learner.get('/api/categories')).status).toBe(200)
    expect((await learner.get('/api/courses')).status).toBe(200)
  })
})

describe('categories', () => {
  it('lists active categories in order and hides archived ones', async () => {
    await addCategory('second', 20)
    await addCategory('first', 10)
    await addCategory('retired', 5, 'archived')

    const learner = await loginLearner()
    const response = await learner.get('/api/categories')

    expect(response.status).toBe(200)
    expect(response.body.categories.map((category: { slug: string }) => category.slug)).toEqual(['first', 'second'])
  })
})

describe('courses', () => {
  it('shows only published courses', async () => {
    const category = await addCategory('mind', 1)
    await addCourse(category._id, 'visible')
    await addCourse(category._id, 'hidden-draft', 'draft')
    await addCourse(category._id, 'hidden-archived', 'archived')

    const learner = await loginLearner()
    const response = await learner.get('/api/courses')

    expect(response.body.courses.map((course: { slug: string }) => course.slug)).toEqual(['visible'])
  })

  it('filters by category slug and returns nothing for an unknown slug', async () => {
    const mind = await addCategory('mind', 1)
    const body = await addCategory('body', 2)
    await addCourse(mind._id, 'sleep')
    await addCourse(body._id, 'back')

    const learner = await loginLearner()
    const filtered = await learner.get('/api/courses?category=body')
    expect(filtered.body.courses.map((course: { slug: string }) => course.slug)).toEqual(['back'])

    const unknown = await learner.get('/api/courses?category=nope')
    expect(unknown.status).toBe(200)
    expect(unknown.body.courses).toEqual([])
  })

  it('hides courses whose category is archived', async () => {
    const retired = await addCategory('retired', 1, 'archived')
    await addCourse(retired._id, 'orphaned')

    const learner = await loginLearner()
    expect((await learner.get('/api/courses')).body.courses).toEqual([])
  })

  it('counts only published lessons', async () => {
    const category = await addCategory('mind', 1)
    const course = await addCourse(category._id, 'sleep')
    const chapter = await ctx.models.Chapter.create({ courseId: course._id, title: 'Basics', status: 'published' })
    const base = { courseId: course._id, chapterId: chapter._id }
    await ctx.models.Lesson.create({ ...base, title: 'One', status: 'published' })
    await ctx.models.Lesson.create({ ...base, title: 'Two', status: 'published' })
    await ctx.models.Lesson.create({ ...base, title: 'Draft', status: 'draft' })

    const learner = await loginLearner()
    const response = await learner.get('/api/courses?category=mind')

    expect(response.body.courses[0].lessonCount).toBe(2)
  })

  it('does not treat operator-style query keys as a filter', async () => {
    const mind = await addCategory('mind', 1)
    const body = await addCategory('body', 2)
    await addCourse(mind._id, 'sleep')
    await addCourse(body._id, 'back')

    const learner = await loginLearner()
    const response = await learner.get('/api/courses?category[$ne]=mind')

    expect(response.status).toBe(200)
    expect(response.body.courses).toHaveLength(2)
  })
})
