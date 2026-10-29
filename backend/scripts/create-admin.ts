// One-time setup: creates the first administrator. There is deliberately no HTTP route for this.
// Usage: npm run create-admin -- --id <loginId> --name "<Display Name>"
// Password: set ADMIN_PASSWORD (12+ characters) or leave it unset to get a generated one, shown once.
import mongoose from 'mongoose'
import { parseArgs } from 'node:util'
import { config } from '../src/config'
import { generatePassword, hashPassword } from '../src/lib/password'
import { User } from '../src/models/User'

const MIN_ADMIN_PASSWORD_LENGTH = 12
const GENERATED_PASSWORD_LENGTH = 16

const { values } = parseArgs({
  options: {
    id: { type: 'string' },
    name: { type: 'string' },
  },
})

const loginId = values.id?.trim().toLowerCase()
if (!loginId || !/^[a-z0-9._-]{3,64}$/.test(loginId)) {
  console.error('Provide --id with 3-64 letters, numbers, dots, dashes or underscores.')
  process.exit(1)
}

const suppliedPassword = process.env.ADMIN_PASSWORD
if (suppliedPassword && suppliedPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
  console.error(`ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`)
  process.exit(1)
}

await mongoose.connect(config.MONGODB_URI)

if (await User.exists({ loginId })) {
  console.error(`A user with ID "${loginId}" already exists. Nothing was changed.`)
  await mongoose.disconnect()
  process.exit(1)
}

const password = suppliedPassword ?? generatePassword(GENERATED_PASSWORD_LENGTH)
await User.create({
  loginId,
  displayName: values.name?.trim() || 'Administrator',
  passwordHash: await hashPassword(password),
  role: 'admin',
})

console.log(`Admin "${loginId}" created.`)
if (!suppliedPassword) console.log(`Password (shown once, save it now): ${password}`)
await mongoose.disconnect()
