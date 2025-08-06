'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Project {
  _id: string
  name: string
  description: string
  timeline: string
  members: Array<{ _id: string; name: string; email: string }>
  createdBy: { _id: string; name: string; email: string }
  createdAt: string
}

// Mock projects data
const mockProjects: Project[] = [
  {
    _id: '1',
    name: 'Website Redesign',
    description: 'Complete redesign of the company website with modern UI/UX',
    timeline: 'Q1 2024',
    members: [
      { _id: '1', name: 'John Employee', email: 'john@company.com' }
    ],
    createdBy: { _id: '2', name: 'Sarah Admin', email: 'sarah@company.com' },
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    _id: '2',
    name: 'Mobile App Development',
    description: 'Development of a new mobile application for iOS and Android',
    timeline: 'Q2 2024',
    members: [
      { _id: '1', name: 'John Employee', email: 'john@company.com' }
    ],
    createdBy: { _id: '2', name: 'Sarah Admin', email: 'sarah@company.com' },
    createdAt: '2024-02-01T14:30:00Z'
  }
]

export default function ProjectsPage() {
  const router = useRouter()
  const [projects] = useState<Project[]>(mockProjects)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="text-xl font-bold text-primary">DF Spaces</span>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => router.push('/profile')}>
                  My Profile
                </Button>
                <Button variant="ghost" onClick={() => router.push('/people')}>
                  People
                </Button>
                <Button variant="ghost" onClick={() => router.push('/projects')}>
                  Projects
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {currentUser.name}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {currentUser.role} • {currentUser.email}
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('mockUser')
                    window.location.href = '/'
                  }
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">View and manage company projects</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription>
                    Created by {project.createdBy.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Timeline:</span>
                    <span className="font-medium">{project.timeline}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Members:</span>
                    <span className="font-medium">{project.members.length}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/projects/${project._id}`)}
                    >
                      View Details
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/projects/${project._id}`)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {projects.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No projects found.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 