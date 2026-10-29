import { Schema, model, type HydratedDocument } from 'mongoose'

export type UserRole = 'admin' | 'learner'
export type UserStatus = 'active' | 'disabled'

export interface IUser {
  loginId: string
  displayName: string
  passwordHash: string
  role: UserRole
  status: UserStatus
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    loginId: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 64 },
    displayName: { type: String, required: true, trim: true, maxlength: 100 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'learner'], default: 'learner', required: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active', required: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
)

export const User = model<IUser>('User', userSchema)

export function toPublicUser(user: HydratedDocument<IUser>) {
  return {
    id: user.id as string,
    loginId: user.loginId,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
  }
}
