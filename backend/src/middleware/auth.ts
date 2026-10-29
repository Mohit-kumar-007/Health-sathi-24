import type { NextFunction, Request, Response } from 'express'
import { config } from '../config'
import { User } from '../models/User'

declare module 'express-session' {
  interface SessionData {
    userId: string
    createdAt: number
  }
}

export const SESSION_IDLE_MS = 30 * 60 * 1000
const SESSION_ABSOLUTE_MS = 8 * 60 * 60 * 1000
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function destroySession(req: Request): Promise<void> {
  return new Promise((resolve) => req.session.destroy(() => resolve()))
}

const LOCAL_DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

// In development any localhost port is fine, so a dev server that moved to another port still works.
// Everywhere else only the configured site may send state-changing requests.
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false
  if (origin === config.CLIENT_ORIGIN) return true
  return config.NODE_ENV === 'development' && LOCAL_DEV_ORIGIN.test(origin)
}

// Blocks cross-site state-changing requests: browsers always send Origin on these.
export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next()
  if (!isAllowedOrigin(req.get('origin'))) {
    return res.status(403).json({ error: 'Request not allowed.' })
  }
  next()
}

// Checks the session AND the account on every request, so deleted or disabled users lose access immediately.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId, createdAt } = req.session
  if (!userId || !createdAt) return res.status(401).json({ error: 'Please log in.' })

  if (Date.now() - createdAt > SESSION_ABSOLUTE_MS) {
    await destroySession(req)
    return res.status(401).json({ error: 'Your session expired. Please log in again.' })
  }

  const user = await User.findById(userId)
  if (!user || user.status !== 'active') {
    await destroySession(req)
    return res.status(401).json({ error: 'Please log in.' })
  }

  res.locals.user = user
  next()
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if (res.locals.user?.role !== 'admin') {
    return res.status(403).json({ error: 'You do not have access to this.' })
  }
  next()
}
