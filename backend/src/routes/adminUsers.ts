import { Router } from 'express'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import { generatePassword, hashPassword } from '../lib/password'
import { requireAdmin, requireAuth } from '../middleware/auth'
import { User, toPublicUser } from '../models/User'

interface AdminUsersDeps {
  destroyUserSessions: (userId: string) => Promise<void>
}

const createBody = z.object({
  loginId: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Use letters, numbers, dots, dashes or underscores.'),
  displayName: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(72).optional(),
})

const resetBody = z.object({ password: z.string().min(8).max(72).optional() })

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const DUPLICATE_KEY_ERROR = 11000

export function createAdminUsersRouter({ destroyUserSessions }: AdminUsersDeps): Router {
  const router = Router()
  router.use(requireAuth, requireAdmin)

  router.get('/', async (req, res) => {
    const query = listQuery.safeParse(req.query)
    if (!query.success) return res.status(400).json({ error: 'Invalid page or limit.' })
    const { page, limit } = query.data

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(),
    ])
    res.json({ users: users.map(toPublicUser), total, page, limit })
  })

  // The generated password is returned once, here; only its hash is stored.
  router.post('/', async (req, res) => {
    const body = createBody.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ error: body.error.issues[0]?.message ?? 'Invalid request.' })
    }

    const temporaryPassword = body.data.password ?? generatePassword()
    try {
      const user = await User.create({
        loginId: body.data.loginId,
        displayName: body.data.displayName,
        passwordHash: await hashPassword(temporaryPassword),
        role: 'learner',
      })
      res.status(201).json({ user: toPublicUser(user), temporaryPassword })
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY_ERROR) {
        return res.status(409).json({ error: 'That login ID is already taken.' })
      }
      throw error
    }
  })

  router.post('/:id/reset-password', async (req, res) => {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user.' })
    if (id === res.locals.user.id) {
      return res.status(400).json({ error: "You can't reset your own password here." })
    }
    const body = resetBody.safeParse(req.body ?? {})
    if (!body.success) return res.status(400).json({ error: 'Passwords must be 8 to 72 characters.' })

    const user = await User.findById(id).select('+passwordHash')
    if (!user) return res.status(404).json({ error: 'User not found.' })

    const temporaryPassword = body.data.password ?? generatePassword()
    user.passwordHash = await hashPassword(temporaryPassword)
    await user.save()
    await destroyUserSessions(id)

    res.json({ temporaryPassword })
  })

  router.delete('/:id', async (req, res) => {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user.' })
    if (id === res.locals.user.id) return res.status(400).json({ error: "You can't delete your own account." })

    const user = await User.findById(id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    if (user.role === 'admin') return res.status(400).json({ error: "Admin accounts can't be deleted here." })

    await user.deleteOne()
    await destroyUserSessions(id)
    res.status(204).end()
  })

  return router
}
