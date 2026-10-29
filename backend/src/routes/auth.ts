import { Router, type Request } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { config } from '../config'
import { DUMMY_HASH, verifyPassword } from '../lib/password'
import { requireAuth } from '../middleware/auth'
import { User, toPublicUser } from '../models/User'

export const authRouter = Router()

const SESSION_COOKIE = 'hs24.sid'
const INCORRECT_LOGIN = 'Incorrect ID or password.'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
})

const loginBody = z.object({
  loginId: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(72),
})

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => req.session.regenerate((error) => (error ? reject(error) : resolve())))
}

authRouter.post('/login', loginLimiter, async (req, res) => {
  const body = loginBody.safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: 'Enter your ID and password.' })

  const user = await User.findOne({ loginId: body.data.loginId.toLowerCase() }).select('+passwordHash')
  const isPasswordValid = await verifyPassword(body.data.password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !isPasswordValid || user.status !== 'active') {
    return res.status(401).json({ error: INCORRECT_LOGIN })
  }

  await regenerateSession(req)
  req.session.userId = user.id
  req.session.createdAt = Date.now()
  user.lastLoginAt = new Date()
  await user.save()

  res.json({ user: toPublicUser(user) })
})

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(SESSION_COOKIE)
    res.status(204).end()
  })
})

authRouter.get('/me', requireAuth, (_req, res) => {
  res.json({ user: toPublicUser(res.locals.user) })
})
