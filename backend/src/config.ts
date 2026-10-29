import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  CLIENT_ORIGIN: z
    .string()
    .url()
    .default('http://localhost:5173')
    .transform((origin) => origin.replace(/\/+$/, '')),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
  throw new Error(`Invalid environment configuration (${problems}). Copy .env.example to .env and fill it in.`)
}

if (parsed.data.NODE_ENV === 'production' && !parsed.data.CLIENT_ORIGIN.startsWith('https://')) {
  throw new Error('CLIENT_ORIGIN must start with https:// in production, for example https://healthsathi24.com')
}

export const config = parsed.data
