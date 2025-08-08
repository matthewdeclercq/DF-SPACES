export type FetchJsonOptions = RequestInit & {
  mockUser?: { id: string; email: string; name?: string; role?: string }
}

export async function fetchJson<T = any>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (options.mockUser) {
    headers.set('X-Mock-User', JSON.stringify(options.mockUser))
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) msg = data.error
    } catch {}
    throw new Error(msg)
  }
  try {
    return (await res.json()) as T
  } catch {
    return undefined as unknown as T
  }
}


