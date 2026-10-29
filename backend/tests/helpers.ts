import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

export const ORIGIN = 'http://localhost:5173'

// Starts an in-memory MongoDB and the real app. Modules are imported after the env is set because config.ts reads it on import.
export async function startTestApp() {
  const mongod = await MongoMemoryServer.create()
  process.env.NODE_ENV = 'test'
  process.env.MONGODB_URI = mongod.getUri('healthsathi24-test')
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters-long'
  process.env.CLIENT_ORIGIN = ORIGIN

  await mongoose.connect(process.env.MONGODB_URI)
  const { User } = await import('../src/models/User')
  const { Category } = await import('../src/models/Category')
  const { Course } = await import('../src/models/Course')
  const { Chapter } = await import('../src/models/Chapter')
  const { Lesson } = await import('../src/models/Lesson')
  const { hashPassword } = await import('../src/lib/password')
  const { createApp } = await import('../src/app')

  const models = { User, Category, Course, Chapter, Lesson }
  await Promise.all(Object.values(models).map((model) => model.init()))
  const created = createApp()

  return {
    app: created.app,
    models,
    hashPassword,
    async reset() {
      await Promise.all([
        User.deleteMany({}),
        Category.deleteMany({}),
        Course.deleteMany({}),
        Chapter.deleteMany({}),
        Lesson.deleteMany({}),
      ])
      await mongoose.connection.collection('sessions').deleteMany({})
    },
    async stop() {
      await created.store.close()
      await mongoose.disconnect()
      await mongod.stop()
    },
  }
}
