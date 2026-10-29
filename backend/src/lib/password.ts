import bcrypt from 'bcryptjs'
import { randomInt } from 'node:crypto'
import { config } from '../config'

// Low cost only under test so the suite stays fast; production uses 12 rounds.
const ROUNDS = config.NODE_ENV === 'test' ? 4 : 12

// No look-alike characters (0/O, 1/l/I) so a password read out loud or typed from paper stays unambiguous.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

// Compared against when a login ID doesn't exist, so response time doesn't reveal which IDs are real.
export const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', ROUNDS)

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generatePassword(length = 12): string {
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }
  return result
}
