export interface ApiResult<T> {
  ok: boolean
  status: number
  data: T | null
  error: string
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
}

// Empty in development (Vite proxies /api). In production it is the API address, for example https://api.healthsathi24.com
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '')

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

const NETWORK_ERROR ="Can't reach the server. Check your connection and try again."
const GENERIC_ERROR = 'Something went wrong. Try again.'

export async function api<T>(path: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
  const hasBody = options.body !== undefined
  try {
    const response = await fetch(apiUrl(path), {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    })
    // A 204 has no body, so a failed parse is expected and simply means "no data".
    const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | null

    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? payload : null,
      error: response.ok ? '' : (payload?.error ?? GENERIC_ERROR),
    }
  } catch {
    return { ok: false, status: 0, data: null, error: NETWORK_ERROR }
  }
}
