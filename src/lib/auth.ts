import { getServerSession } from 'next-auth'
import type { NextRequest } from 'next/server'

export type AppMode = 'mock' | 'real'

export function getAppMode(): AppMode {
  const mode = (process.env.APP_MODE || '').toLowerCase()
  return mode === 'mock' ? 'mock' : 'real'
}

export async function getAuthFromRequest(request: NextRequest) {
  const session = await getServerSession()
  if (session?.user?.email) {
    return {
      email: session.user.email,
      id: session.user.id,
      name: session.user.name || '',
      role: (session as any).user?.role || ((session as any).user?.isAdmin ? 'admin' : 'user'),
      isAdmin: Boolean((session as any).user?.isAdmin) || ((session as any).user?.role === 'admin'),
    }
  }
  const mockHeader = request.headers.get('x-mock-user')
  if (mockHeader) {
    try {
      const user = JSON.parse(mockHeader as string)
      if (user?.email) {
        return {
          email: user.email,
          id: user.id,
          name: user.name || '',
          role: user.role || 'user',
          isAdmin: user.role === 'admin',
        }
      }
    } catch {}
  }
  return null
}

const DEFAULT_ADMIN = 'm_declercq@digitalfoundry.com'

export function isDefaultAdmin(email?: string | null): boolean {
  return email ? email === DEFAULT_ADMIN : false
}

export function isAdminEmail(email?: string | null): boolean {
  return email ? (email === 'sarah@company.com' || email === DEFAULT_ADMIN) : false
}


