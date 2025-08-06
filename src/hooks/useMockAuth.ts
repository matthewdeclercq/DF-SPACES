'use client'

import { useState, useEffect } from 'react'
import { mockAuth, MockUser } from '@/lib/mock-auth'

export interface MockSession {
  user: MockUser
  expires: string
}

export function useMockAuth() {
  const [session, setSession] = useState<MockSession | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentSession = mockAuth.getSession()
    setSession(currentSession)
    setStatus(currentSession ? 'authenticated' : 'unauthenticated')
  }, [])

  const signIn = (email: string) => {
    const user = mockAuth.signIn(email)
    if (user) {
      const newSession = mockAuth.getSession()
      setSession(newSession)
      setStatus('authenticated')
      return user
    }
    return null
  }

  const signOut = () => {
    mockAuth.signOut()
    setSession(null)
    setStatus('unauthenticated')
  }

  // Don't return role checks until component is mounted to avoid SSR issues
  if (!mounted) {
    return {
      data: null,
      status: 'loading',
      signIn,
      signOut,
      isAdmin: false,
      isEmployee: false
    }
  }

  return {
    data: session,
    status,
    signIn,
    signOut,
    isAdmin: mockAuth.isAdmin(),
    isEmployee: mockAuth.isEmployee()
  }
} 