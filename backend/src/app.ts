import express, { type NextFunction, type Request, type Response } from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import helmet from 'helmet'
import { config } from './config'
import { SESSION_IDLE_MS, requireSameOrigin } from './middleware/auth'
import { authRouter } from './routes/auth'
import { createAdminUsersRouter } from './routes/adminUsers'
import { contentRouter } from './routes/content'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  if (config.NODE_ENV === 'production') app.set('trust proxy', 1)

  app.use(helmet())
  app.use(express.json({ limit: '10kb' }))

  const store = MongoStore.create({
    mongoUrl: config.MONGODB_URI,
    stringify: false,
    ttl: SESSION_IDLE_MS / 1000,
  })

  app.use(
    session({
      name: 'hs24.sid',
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.NODE_ENV === 'production',
        maxAge: SESSION_IDLE_MS,
      },
    }),
  )

  async function destroyUserSessions(userId: string): Promise<void> {
    const sessions = await store.collectionP
    await sessions.deleteMany({ 'session.userId': userId })
  }

  app.get('/', (_req, res) => {
    res
      .type('html')
      .send(
        '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width, initial-scale=1">' +
          '<title>HealthSathi24 backend</title></head>' +
          '<body style="font-family:system-ui,sans-serif;max-width:34rem;margin:4rem auto;padding:0 1rem;color:#16284b">' +
          '<h1>HealthSathi24 backend is working</h1>' +
          `<p>The API is running. Open the website at <a href="${config.CLIENT_ORIGIN}">${config.CLIENT_ORIGIN}</a>.</p>` +
          '<p><a href="/api/health">Health check</a></p></body></html>',
      )
  })

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api', requireSameOrigin)
  app.use('/api/auth', authRouter)
  app.use('/api/admin/users', createAdminUsersRouter({ destroyUserSessions }))
  app.use('/api', contentRouter)

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found.' })
  })

  app.use((error: { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    if (error.status === 400) return res.status(400).json({ error: 'Invalid request.' })
    console.error('Unhandled error:', error)
    res.status(500).json({ error: 'Something went wrong.' })
  })

  return { app, store }
}
