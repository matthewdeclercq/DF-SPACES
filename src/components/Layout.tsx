'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get current user from localStorage only in browser
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('mockUser')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setCurrentUser(user)
          setIsAdmin(user.role === 'admin')
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error)
      }
    }
  }, [])

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockUser')
      window.location.href = '/'
    }
  }

  // Don't render navigation until component is mounted to avoid hydration issues
  if (!mounted) {
    return <>{children}</>
  }

  // If no user is logged in, just show the children (for login page)
  if (!currentUser) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/profile" className="text-xl font-bold text-primary">
                DF Spaces
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/profile">
                  <Button variant="ghost">My Profile</Button>
                </Link>
                <Link href="/people">
                  <Button variant="ghost">People</Button>
                </Link>
                <Link href="/projects">
                  <Button variant="ghost">Projects</Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">
                  Welcome, {currentUser.name}
                </span>
                <div className="text-xs text-muted-foreground">
                  {currentUser.role} • {currentUser.email}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
} 