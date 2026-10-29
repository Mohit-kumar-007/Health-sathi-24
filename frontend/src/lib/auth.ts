import { api } from './api'

export type LoginResult = { ok: true } | { ok: false; message: string }

export async function logout(): Promise<void> {
  await api<null>('/api/auth/logout', { method: 'POST', body: {} })
  window.location.assign('/login')
}

export async function login(loginId: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ loginId, password }),
    })

    if (response.ok) return { ok: true }
    if (response.status === 400 || response.status === 401) {
      return { ok: false, message: 'Incorrect ID or password.' }
    }
    if (response.status === 429) {
      return { ok: false, message: 'Too many attempts. Wait a few minutes and try again.' }
    }
    return { ok: false, message: "The login service isn't available right now. Try again in a moment." }
  } catch {
    return { ok: false, message: "Can't reach the server. Check your connection and try again." }
  }
}
