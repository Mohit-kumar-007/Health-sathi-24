// Local development only. Runs a MongoDB (no install needed) that keeps its data in backend/.data/db,
// creates the first admin if there is none, loads the starter catalogue, then starts the API on port 4000.
// Usage: npm run dev:local
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { MongoMemoryServer } from 'mongodb-memory-server'

const DB_PATH = '.data/db'
const DB_PORT = 27018
const API_PORT = 4000
const ADMIN_PASSWORD_LENGTH = 16

// A second copy can't share the database folder, so stop early with a plain explanation.
const isAlreadyRunning = await fetch(`http://localhost:${API_PORT}/api/health`)
  .then((response) => response.ok)
  .catch(() => false)
if (isAlreadyRunning) {
  console.log(`The backend is already running on http://localhost:${API_PORT}. Nothing to start.`)
  console.log('To restart it, press Ctrl+C in the terminal where it is running, then run this again.')
  process.exit(0)
}

mkdirSync(DB_PATH, { recursive: true })
let mongod: MongoMemoryServer
try {
  mongod = await MongoMemoryServer.create({
    instance: { port: DB_PORT, dbPath: DB_PATH, storageEngine: 'wiredTiger' },
  })
} catch (error) {
  console.error('')
  console.error('The local database could not start.')
  console.error(`Another copy of this command, or a database from an earlier run, is probably still using port ${DB_PORT}.`)
  console.error('Close other terminals running "npm run dev:local" and try again.')
  console.error(`Details: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`)
  process.exit(1)
}

process.env.NODE_ENV = 'development'
process.env.MONGODB_URI = mongod.getUri('healthsathi24')
process.env.SESSION_SECRET ??= 'local-development-only-session-secret-0123456789'
process.env.CLIENT_ORIGIN ??= 'http://localhost:5173'
process.env.PORT ??= String(API_PORT)

// Modules read the environment when imported, so they are loaded only after it is set above.
const mongoose = (await import('mongoose')).default
await mongoose.connect(process.env.MONGODB_URI)
const { User } = await import('../src/models/User')
const { generatePassword, hashPassword } = await import('../src/lib/password')

if (!(await User.exists({ role: 'admin' }))) {
  const password = generatePassword(ADMIN_PASSWORD_LENGTH)
  await User.create({
    loginId: 'admin',
    displayName: 'Administrator',
    passwordHash: await hashPassword(password),
    role: 'admin',
  })
  console.log('')
  console.log('First admin created. Save these now, the password is not shown again:')
  console.log('  Login ID: admin')
  console.log(`  Password: ${password}`)
  console.log('')
}

execFileSync('npx', ['tsx', 'scripts/seed-content.ts'], { env: process.env, stdio: 'inherit', shell: true })

const { createApp } = await import('../src/app')
createApp().app.listen(Number(process.env.PORT), () => {
  console.log(`API ready on http://localhost:${process.env.PORT}. Open http://localhost:5173/login`)
})

async function shutdown() {
  await mongoose.disconnect()
  await mongod.stop({ doCleanup: false })
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
