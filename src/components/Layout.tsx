'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useMemo } from 'react'
import { Menu, X, User, FolderOpen, LogOut, MessageSquare, Users } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const [appMode, setAppMode] = useState<'mock' | 'real' | null>(null)

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
    if (appMode === 'real' && session?.user) {
      setCurrentUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || (session.user.isAdmin ? 'admin' : 'user')
      })
      setIsAdmin(Boolean(session.user.isAdmin) || session.user.role === 'admin')
    }
  }, [appMode, session])

  const handleSignOut = () => {
    if (appMode === 'mock') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mockUser')
        window.location.href = '/'
      }
    } else {
      void nextAuthSignOut({ callbackUrl: '/' })
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Don't render navigation until component is mounted to avoid hydration issues
  if (!mounted) {
    return <>{children}</>
  }

  // If no user is logged in, just show the children (for login page)
  const isAuthenticated = appMode === 'mock' ? Boolean(currentUser) : status === 'authenticated'
  const isOnLogin = typeof window !== 'undefined' && window.location.pathname === '/'
  if (appMode === null) {
    return <>{children}</>
  }
  if (!isAuthenticated && isOnLogin) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center space-x-6">
              <Link href="/profile" className="text-xl font-bold text-primary">
                DF Pulse
              </Link>
              
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/profile">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Button>
                </Link>
                {/* People link removed per requirements */}
                {/* My Feedback link removed */}
                {isAdmin && (
                  <Link href="/admin/feedback">
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Feedback Administration</span>
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin/users">
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin/projects">
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <FolderOpen className="h-4 w-4" />
                      <span>Project Management</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Desktop User Info, Theme Toggle, and Logout */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">
                  Welcome, {currentUser.name}
                </span>
                <div className="text-xs text-muted-foreground">
                  {currentUser.role} • {currentUser.email}
                </div>
              </div>
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="space-y-3">
                {/* Mobile Navigation Links */}
                <Link href="/profile" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="w-full justify-start flex items-center space-x-3">
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Button>
                </Link>
                {/* People link removed per requirements */}
                {/* My Feedback link removed */}
                {isAdmin && (
                  <Link href="/admin/feedback" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-3">
                      <MessageSquare className="h-4 w-4" />
                      <span>Feedback Administration</span>
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin/users" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-3">
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin/projects" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-3">
                      <FolderOpen className="h-4 w-4" />
                      <span>Project Management</span>
                    </Button>
                  </Link>
                )}
                
                {/* Mobile User Info */}
                <div className="pt-3 border-t">
                  <div className="text-sm text-muted-foreground mb-2">
                    Welcome, {currentUser.name}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {currentUser.role} • {currentUser.email}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
} 