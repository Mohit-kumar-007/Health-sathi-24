import { useEffect, useState } from 'react'
import { api } from './api'
import type { PublicUser } from './users'

export type CurrentUserState =
  | { status: 'loading' }
  | { status: 'ready'; user: PublicUser }
  | { status: 'error'; message: string }

// Loads the signed-in user, and sends anyone without a valid session to the login page.
export function useCurrentUser(): CurrentUserState {
  const [state, setState] = useState<CurrentUserState>({ status: 'loading' })

  useEffect(() => {
    let isActive = true
    api<{ user: PublicUser }>('/api/auth/me').then((result) => {
      if (!isActive) return
      if (result.ok && result.data) {
        setState({ status: 'ready', user: result.data.user })
      } else if (result.status === 401) {
        window.location.replace('/login')
      } else {
        setState({ status: 'error', message: result.error })
      }
    })
    return () => {
      isActive = false
    }
  }, [])

  return state
}
