'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { signIn, useSession } from 'next-auth/react'

// Simple mock users for testing
const mockUsers = [
  {
    id: '1',
    name: 'John Employee',
    email: 'john@company.com',
    role: 'employee'
  },
  {
    id: '2',
    name: 'Sarah Admin',
    email: 'sarah@company.com',
    role: 'admin'
  }
]

export default function HomePage() {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [availableUsers, setAvailableUsers] = useState<typeof mockUsers>(mockUsers)
  const { data: session } = useSession()
  const [appMode, setAppMode] = useState<'mock' | 'real'>('real')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/config')
        const data = res.ok ? await res.json() : { appMode: 'real' }
        if (!cancelled) setAppMode(data.appMode === 'mock' ? 'mock' : 'real')
      } catch {
        if (!cancelled) setAppMode('real')
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (appMode === 'mock') {
        try {
          const res = await fetch('/api/users')
          if (res.ok) {
            const users = await res.json()
            if (!cancelled && Array.isArray(users) && users.length > 0) {
              const normalized = users.map((u: any, idx: number) => ({ id: u._id || `${idx}`, name: u.name, email: u.email, role: u.email === 'sarah@company.com' ? 'admin' : 'employee' }))
              setAvailableUsers(normalized as any)
            }
          }
        } catch {}
      }
    })()
    return () => { cancelled = true }
  }, [appMode])

  useEffect(() => {
    if (session?.user?.id) {
      router.push('/profile')
    }
  }, [session, router])

  const handleSignIn = () => {
    if (selectedUser) {
      const user = availableUsers.find(u => u.email === selectedUser)
      if (user) {
        localStorage.setItem('mockUser', JSON.stringify(user))
        router.push('/profile')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Theme Toggle in top right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            DF Pulse
          </CardTitle>
          <CardDescription className="text-lg">
            Welcome to your company intranet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {appMode === 'mock' ? (
            <p className="text-center text-muted-foreground">
              Select a user to sign in (Mock Authentication)
            </p>
          ) : (
            <p className="text-center text-muted-foreground">
              Sign in with Google using your digitalfoundry.com email
            </p>
          )}
          
          {appMode === 'mock' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Choose User:</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">Select a user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {appMode === 'mock' ? (
            <Button
              onClick={handleSignIn}
              disabled={!selectedUser}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          ) : (
            <Button className="w-full" size="lg" onClick={() => signIn('google')}>Sign in with Google</Button>
          )}

          {appMode === 'mock' && (
            <div className="text-xs text-muted-foreground text-center">
              <p><strong>John Employee:</strong> Can edit profile and view projects</p>
              <p><strong>Sarah Admin:</strong> Can edit profile, create/delete projects</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 