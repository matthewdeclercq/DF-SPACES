'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { Menu, X, User, Users, FolderOpen, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
  if (!currentUser) {
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
                DF Spaces
              </Link>
              
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/profile">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Button>
                </Link>
                <Link href="/people">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>People</span>
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <FolderOpen className="h-4 w-4" />
                    <span>Projects</span>
                  </Button>
                </Link>
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
                <Link href="/people" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="w-full justify-start flex items-center space-x-3">
                    <Users className="h-4 w-4" />
                    <span>People</span>
                  </Button>
                </Link>
                <Link href="/projects" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="w-full justify-start flex items-center space-x-3">
                    <FolderOpen className="h-4 w-4" />
                    <span>Projects</span>
                  </Button>
                </Link>
                
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