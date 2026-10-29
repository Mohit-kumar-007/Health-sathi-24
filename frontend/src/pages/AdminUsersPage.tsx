import { useCallback, useEffect, useState } from 'react'
import { CreateUserForm } from '../components/CreateUserForm'
import { CredentialsNotice } from '../components/CredentialsNotice'
import { Logo } from '../components/Logo'
import { logout } from '../lib/auth'
import { useCurrentUser } from '../lib/useCurrentUser'
import { PAGE_SIZE, deleteUser, listUsers, resetPassword, type PublicUser, type UserList } from '../lib/users'

interface Notice {
  heading: string
  loginId: string
  password: string
}

const secondaryButton =
  'rounded-full border-2 border-navy/15 px-4 py-1.5 text-sm font-bold text-navy hover:border-navy/40 disabled:opacity-60'

function formatDate(value: string | null): string {
  if (!value) return 'Never'
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminUsersPage() {
  const current = useCurrentUser()
  const [page, setPage] = useState(1)
  const [list, setList] = useState<UserList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const isAdmin = current.status === 'ready' && current.user.role === 'admin'

  const loadUsers = useCallback(async (targetPage: number) => {
    setIsLoading(true)
    const result = await listUsers(targetPage)
    setIsLoading(false)

    if (result.status === 401) return window.location.replace('/login')
    if (result.status === 403) return window.location.replace('/dashboard')
    if (!result.ok || !result.data) {
      setLoadError(result.error)
      return
    }
    setLoadError('')
    setList(result.data)
  }, [])

  useEffect(() => {
    document.title = 'Users | HealthSathi24 admin'
    if (current.status === 'ready' && current.user.role !== 'admin') window.location.replace('/dashboard')
  }, [current])

  useEffect(() => {
    if (isAdmin) void loadUsers(page)
  }, [isAdmin, page, loadUsers])

  function handleCreated(loginId: string, password: string) {
    setNotice({ heading: 'Account created', loginId, password })
    setActionError('')
    if (page === 1) void loadUsers(1)
    else setPage(1)
  }

  async function handleReset(user: PublicUser) {
    setBusyId(user.id)
    setActionError('')
    const result = await resetPassword(user.id)
    setBusyId(null)
    if (!result.ok || !result.data) return setActionError(result.error)
    setNotice({ heading: 'Password reset', loginId: user.loginId, password: result.data.temporaryPassword })
  }

  async function handleDelete(user: PublicUser) {
    setBusyId(user.id)
    setActionError('')
    const result = await deleteUser(user.id)
    setBusyId(null)
    setPendingDeleteId(null)
    if (!result.ok) return setActionError(result.error)
    if (notice?.loginId === user.loginId) setNotice(null)

    const isLastOnPage = (list?.users.length ?? 0) === 1 && page > 1
    if (isLastOnPage) setPage(page - 1)
    else void loadUsers(page)
  }

  if (current.status === 'loading') return <p className="p-8 text-ink-soft">Loading…</p>
  if (current.status === 'error') {
    return (
      <p role="alert" className="p-8 text-red-800">
        {current.message}
      </p>
    )
  }
  if (!isAdmin) return null

  const totalPages = list ? Math.max(1, Math.ceil(list.total / PAGE_SIZE)) : 1

  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      <aside className="flex flex-col justify-between gap-6 bg-navy p-5 text-white md:min-h-screen">
        <div>
          <a href="/" aria-label="HealthSathi24 home">
            <Logo light />
          </a>
          <nav aria-label="Admin navigation" className="mt-8">
            <a
              href="/admin/users"
              aria-current="page"
              className="block rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white"
            >
              Users
            </a>
          </nav>
        </div>
        <div>
          <p className="text-sm text-white/70">Signed in as</p>
          <p className="font-bold">{current.user.displayName}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 rounded-full border-2 border-white/30 px-5 py-2 text-sm font-bold text-white hover:border-white/60"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="space-y-6 bg-ivory p-4 sm:p-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">Users</h1>
          <p className="mt-1 text-ink-soft">Create learner accounts, reset passwords and remove access.</p>
        </div>

        {notice && (
          <CredentialsNotice
            heading={notice.heading}
            loginId={notice.loginId}
            password={notice.password}
            onDismiss={() => setNotice(null)}
          />
        )}

        <CreateUserForm onCreated={handleCreated} />

        <section aria-labelledby="accounts-heading" className="rounded-2xl border border-pale bg-white p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="accounts-heading" className="text-lg font-extrabold text-navy">
              All accounts
            </h2>
            {list && <p className="text-sm text-ink-soft">{list.total} total</p>}
          </div>

          <div role="alert" className="min-h-2">
            {(loadError || actionError) && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{loadError || actionError}</p>
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-pale text-xs uppercase tracking-wider text-ink-soft">
                  <th scope="col" className="py-2 pr-4 font-bold">Login ID</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Name</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Role</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Last login</th>
                  <th scope="col" className="py-2 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list?.users.map((user) => {
                  const isSelf = user.id === current.user.id
                  const isManageable = user.role === 'learner'
                  return (
                    <tr key={user.id} className="border-b border-pale/70 last:border-0">
                      <td className="py-3 pr-4 font-mono font-bold text-navy">{user.loginId}</td>
                      <td className="py-3 pr-4 text-navy">{user.displayName}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold capitalize text-primary-dark">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-ink-soft">{formatDate(user.lastLoginAt)}</td>
                      <td className="py-3">
                        {!isManageable ? (
                          <span className="text-ink-soft">{isSelf ? 'You' : 'Admin'}</span>
                        ) : pendingDeleteId === user.id ? (
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-red-800">Delete {user.loginId}?</span>
                            <button
                              type="button"
                              disabled={busyId === user.id}
                              onClick={() => handleDelete(user)}
                              className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60"
                            >
                              Yes, delete
                            </button>
                            <button type="button" onClick={() => setPendingDeleteId(null)} className={secondaryButton}>
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busyId === user.id}
                              onClick={() => handleReset(user)}
                              className={secondaryButton}
                            >
                              Reset password
                            </button>
                            <button type="button" onClick={() => setPendingDeleteId(user.id)} className={secondaryButton}>
                              Delete
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {isLoading && !list && <p className="py-6 text-ink-soft">Loading accounts…</p>}
            {list && list.users.length === 0 && <p className="py-6 text-ink-soft">No accounts yet.</p>}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-4 flex items-center justify-between">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className={secondaryButton}>
                Previous
              </button>
              <span className="text-sm text-ink-soft">
                Page {page} of {totalPages}
              </span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className={secondaryButton}>
                Next
              </button>
            </nav>
          )}
        </section>
      </main>
    </div>
  )
}
