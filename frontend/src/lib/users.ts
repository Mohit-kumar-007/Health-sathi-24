import { api } from './api'

export interface PublicUser {
  id: string
  loginId: string
  displayName: string
  role: 'admin' | 'learner'
  status: 'active' | 'disabled'
  lastLoginAt: string | null
  createdAt: string
}

export interface UserList {
  users: PublicUser[]
  total: number
  page: number
  limit: number
}

export interface NewUserInput {
  loginId: string
  displayName: string
  password?: string
}

export const PAGE_SIZE = 20

export function listUsers(page: number) {
  return api<UserList>(`/api/admin/users?page=${page}&limit=${PAGE_SIZE}`)
}

export function createUser(input: NewUserInput) {
  return api<{ user: PublicUser; temporaryPassword: string }>('/api/admin/users', { method: 'POST', body: input })
}

export function resetPassword(id: string) {
  return api<{ temporaryPassword: string }>(`/api/admin/users/${id}/reset-password`, { method: 'POST', body: {} })
}

export function deleteUser(id: string) {
  return api<null>(`/api/admin/users/${id}`, { method: 'DELETE' })
}
