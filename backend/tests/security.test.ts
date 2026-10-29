import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'

const ORIGIN = 'http://localhost:5173'
const ADMIN = { loginId: 'admin', password: 'Admin-Pass-12345' }

let mongod: MongoMemoryServer
let app: Parameters<typeof request>[0]
let closeStore: () => Promise<void>
let User: typeof import('../src/models/User').User
let hashPassword: typeof import('../src/lib/password').hashPassword

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  process.env.NODE_ENV = 'test'
  process.env.MONGODB_URI = mongod.getUri('healthsathi24-test')
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters-long'
  process.env.CLIENT_ORIGIN = ORIGIN

  await mongoose.connect(process.env.MONGODB_URI)
  ;({ User } = await import('../src/models/User'))
  ;({ hashPassword } = await import('../src/lib/password'))
  const { createApp } = await import('../src/app')
  const created = createApp()
  app = created.app
  closeStore = async () => created.store.close()
  await User.init()
})

afterAll(async () => {
  await closeStore()
  await mongoose.disconnect()
  await mongod.stop()
})

beforeEach(async () => {
  await User.deleteMany({})
  await mongoose.connection.collection('sessions').deleteMany({})
  await User.create({
    loginId: ADMIN.loginId,
    displayName: 'Admin',
    passwordHash: await hashPassword(ADMIN.password),
    role: 'admin',
  })
})

const post = (agent: ReturnType<typeof request.agent>, path: string, body: object = {}, origin = ORIGIN) =>
  agent.post(path).set('Origin', origin).send(body)

async function loggedInAgent(loginId: string, password: string) {
  const agent = request.agent(app)
  const response = await post(agent, '/api/auth/login', { loginId, password })
  expect(response.status).toBe(200)
  return agent
}

async function createLearner(admin: ReturnType<typeof request.agent>, loginId = 'learner1') {
  const response = await post(admin, '/api/admin/users', { loginId, displayName: 'Learner One' })
  expect(response.status).toBe(201)
  return response.body as { user: { id: string }; temporaryPassword: string }
}

describe('registration', () => {
  it('has no public register route', async () => {
    const response = await post(request.agent(app), '/api/auth/register', { loginId: 'x1x', password: 'password123' })
    expect(response.status).toBe(404)
  })

  it('rejects anonymous account creation', async () => {
    const response = await post(request.agent(app), '/api/admin/users', { loginId: 'sneaky', displayName: 'Sneaky' })
    expect(response.status).toBe(401)
  })
})

describe('login', () => {
  it('sets an HttpOnly session cookie and never returns the password hash', async () => {
    const response = await post(request.agent(app), '/api/auth/login', ADMIN)
    expect(response.status).toBe(200)
    expect(response.body.user.loginId).toBe('admin')
    expect(JSON.stringify(response.body)).not.toContain('passwordHash')
    expect(response.headers['set-cookie']?.[0]).toMatch(/HttpOnly/i)
  })

  it('treats the login ID as case-insensitive', async () => {
    const response = await post(request.agent(app), '/api/auth/login', { loginId: 'ADMIN', password: ADMIN.password })
    expect(response.status).toBe(200)
  })

  it('gives the same error for a wrong password and an unknown ID', async () => {
    const wrongPassword = await post(request.agent(app), '/api/auth/login', { loginId: 'admin', password: 'nope-nope-nope' })
    const unknownUser = await post(request.agent(app), '/api/auth/login', { loginId: 'ghost', password: 'nope-nope-nope' })
    expect(wrongPassword.status).toBe(401)
    expect(unknownUser.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownUser.body)
  })

  it('rejects a login from a different origin', async () => {
    const response = await post(request.agent(app), '/api/auth/login', ADMIN, 'https://evil.example')
    expect(response.status).toBe(403)
  })
})

describe('authorization', () => {
  it('blocks a learner from every admin endpoint', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    const { user, temporaryPassword } = await createLearner(admin)
    const learner = await loggedInAgent('learner1', temporaryPassword)

    expect((await learner.get('/api/admin/users')).status).toBe(403)
    expect((await post(learner, '/api/admin/users', { loginId: 'another', displayName: 'A' })).status).toBe(403)
    expect((await post(learner, `/api/admin/users/${user.id}/reset-password`)).status).toBe(403)
    expect((await learner.delete(`/api/admin/users/${user.id}`).set('Origin', ORIGIN)).status).toBe(403)
  })

  it('blocks anonymous requests to protected routes', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401)
    expect((await request(app).get('/api/admin/users')).status).toBe(401)
  })

  it('cuts off a disabled user on their very next request', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    const { temporaryPassword } = await createLearner(admin)
    const learner = await loggedInAgent('learner1', temporaryPassword)
    expect((await learner.get('/api/auth/me')).status).toBe(200)

    await User.updateOne({ loginId: 'learner1' }, { status: 'disabled' })
    expect((await learner.get('/api/auth/me')).status).toBe(401)
  })
})

describe('admin user management', () => {
  it('creates a learner with a one-time temporary password the learner can log in with', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    const { user, temporaryPassword } = await createLearner(admin)
    expect(temporaryPassword.length).toBeGreaterThanOrEqual(12)
    expect(JSON.stringify(user)).not.toContain('passwordHash')

    const learner = await loggedInAgent('learner1', temporaryPassword)
    const me = await learner.get('/api/auth/me')
    expect(me.body.user.role).toBe('learner')
  })

  it('rejects a duplicate login ID', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    await createLearner(admin)
    const again = await post(admin, '/api/admin/users', { loginId: 'LEARNER1', displayName: 'Dup' })
    expect(again.status).toBe(409)
  })

  it('ignores any role the caller tries to set', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    const response = await post(admin, '/api/admin/users', { loginId: 'wannabe', displayName: 'W', role: 'admin' })
    expect(response.status).toBe(201)
    expect(response.body.user.role).toBe('learner')
  })

  it('resets a password and signs the learner out everywhere', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    const { user, temporaryPassword } = await createLearner(admin)
    const learner = await loggedInAgent('learner1', temporaryPassword)

    const reset = await post(admin, `/api/admin/users/${user.id}/reset-password`)
    expect(reset.status).toBe(200)

    expect((await learner.get('/api/auth/me')).status).toBe(401)
    const oldLogin = await post(request.agent(app), '/api/auth/login', { loginId: 'learner1', password: temporaryPassword })
    expect(oldLogin.status).toBe(401)
    await loggedInAgent('learner1', reset.body.temporaryPassword)
  })

  it('deletes a learner so they can no longer log in', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    const { user, temporaryPassword } = await createLearner(admin)
    const learner = await loggedInAgent('learner1', temporaryPassword)

    const removed = await admin.delete(`/api/admin/users/${user.id}`).set('Origin', ORIGIN)
    expect(removed.status).toBe(204)
    expect((await learner.get('/api/auth/me')).status).toBe(401)
    const login = await post(request.agent(app), '/api/auth/login', { loginId: 'learner1', password: temporaryPassword })
    expect(login.status).toBe(401)
  })

  it('refuses to delete an admin or the signed-in account', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    const me = await admin.get('/api/auth/me')
    const response = await admin.delete(`/api/admin/users/${me.body.user.id}`).set('Origin', ORIGIN)
    expect(response.status).toBe(400)
  })

  it('rejects a malformed user ID', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    const response = await admin.delete('/api/admin/users/not-an-id').set('Origin', ORIGIN)
    expect(response.status).toBe(400)
  })
})

describe('password changes', () => {
  it('gives learners no way to change their own password', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    const { temporaryPassword } = await createLearner(admin)
    const learner = await loggedInAgent('learner1', temporaryPassword)

    const attempt = await post(learner, '/api/auth/change-password', {
      currentPassword: temporaryPassword,
      newPassword: 'My-Own-Password-1',
    })
    expect(attempt.status).toBe(404)
    await loggedInAgent('learner1', temporaryPassword)
  })
})

describe('status page', () => {
  it('shows that the backend is working at the root address', async () => {
    const response = await request(app).get('/')
    expect(response.status).toBe(200)
    expect(response.text).toContain('HealthSathi24 backend is working')
  })
})

describe('logout', () => {
  it('ends the session', async () => {
    const admin = await loggedInAgent(ADMIN.loginId, ADMIN.password)
    expect((await post(admin, '/api/auth/logout')).status).toBe(204)
    expect((await admin.get('/api/auth/me')).status).toBe(401)
  })
})
