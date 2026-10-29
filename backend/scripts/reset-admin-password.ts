// Sets a new password for an existing admin, for when it was lost. Not reachable over HTTP.
// Usage: npm run reset-admin-password -- --id admin [--local]
//   --local   use the database started by `npm run dev:local`
// Password: set ADMIN_PASSWORD (12+ characters) or leave it unset to get a generated one, shown once.
import { parseArgs } from 'node:util'

const MIN_ADMIN_PASSWORD_LENGTH = 12
const GENERATED_PASSWORD_LENGTH = 16
const LOCAL_DB_URI = 'mongodb://127.0.0.1:27018/healthsathi24'

const { values } = parseArgs({
  options: {
    id: { type: 'string' },
    local: { type: 'boolean', default: false },
  },
})

const loginId = values.id?.trim().toLowerCase()
if (!loginId) {
  console.error('Provide --id with the admin login ID, for example: --id admin')
  process.exit(1)
}

const suppliedPassword = process.env.ADMIN_PASSWORD
if (suppliedPassword && suppliedPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
  console.error(`ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`)
  process.exit(1)
}

if (values.local) {
  process.env.MONGODB_URI = LOCAL_DB_URI
  process.env.SESSION_SECRET ??= 'local-development-only-session-secret-0123456789'
}

// Loaded after the environment is final, because config.ts reads it on import.
const mongoose = (await import('mongoose')).default
const { config } = await import('../src/config')
const { generatePassword, hashPassword } = await import('../src/lib/password')
const { User } = await import('../src/models/User')

await mongoose.connect(config.MONGODB_URI)

const admin = await User.findOne({ loginId, role: 'admin' }).select('+passwordHash')
if (!admin) {
  console.error(`No admin with ID "${loginId}" was found. Nothing was changed.`)
  await mongoose.disconnect()
  process.exit(1)
}

const password = suppliedPassword ?? generatePassword(GENERATED_PASSWORD_LENGTH)
admin.passwordHash = await hashPassword(password)
await admin.save()
await mongoose.connection.collection('sessions').deleteMany({ 'session.userId': admin.id })

console.log(`Password reset for admin "${loginId}". Any existing logins for it were signed out.`)
if (!suppliedPassword) console.log(`New password (shown once, save it now): ${password}`)
await mongoose.disconnect()
