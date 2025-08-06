'use client'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ProjectMember {
  _id: string
  name: string
  email: string
}

interface Project {
  _id: string
  name: string
  description: string
  timeline: string
  members: ProjectMember[]
  createdBy: ProjectMember
  createdAt: string
}

// Mock project data
const mockProjects: Project[] = [
  {
    _id: '1',
    name: 'Website Redesign',
    description: 'Complete redesign of the company website with modern UI/UX. This project involves creating a new responsive design, improving user experience, and implementing modern web technologies. The team will work on wireframing, design mockups, frontend development, and testing.',
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
    description: 'Development of a new mobile application for iOS and Android platforms. The app will provide real-time project tracking, team collaboration features, and client communication tools.',
    timeline: 'Q2 2024',
    members: [
      { _id: '1', name: 'John Employee', email: 'john@company.com' },
      { _id: '3', name: 'Mike Developer', email: 'mike@company.com' }
    ],
    createdBy: { _id: '2', name: 'Sarah Admin', email: 'sarah@company.com' },
    createdAt: '2024-02-01T14:30:00Z'
  }
]

// Available users for adding to projects
const availableUsers: ProjectMember[] = [
  { _id: '1', name: 'John Employee', email: 'john@company.com' },
  { _id: '2', name: 'Sarah Admin', email: 'sarah@company.com' },
  { _id: '3', name: 'Mike Developer', email: 'mike@company.com' },
  { _id: '4', name: 'Lisa Designer', email: 'lisa@company.com' }
]

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    timeline: ''
  })
  
  // Member management state
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')

  useEffect(() => {
    setMounted(true)
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
    if (mounted && params?.id) {
      const projectId = Array.isArray(params.id) ? params.id[0] : params.id
      console.log('Loading project with ID:', projectId)
      
      // Find project in mock data
      const foundProject = mockProjects.find(p => p._id === projectId)
      if (foundProject) {
        console.log('Found project:', foundProject.name)
        setProject(foundProject)
        setEditForm({
          name: foundProject.name,
          description: foundProject.description,
          timeline: foundProject.timeline
        })
      } else {
        console.log('Project not found for ID:', projectId)
      }
    }
  }, [mounted, params?.id])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (project) {
      setEditForm({
        name: project.name,
        description: project.description,
        timeline: project.timeline
      })
    }
  }

  const handleSave = () => {
    if (project) {
      const updatedProject = {
        ...project,
        name: editForm.name,
        description: editForm.description,
        timeline: editForm.timeline
      }
      setProject(updatedProject)
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this project?')) {
      router.push('/projects')
    }
  }

  const handleAddMember = () => {
    if (selectedMemberId && project) {
      const memberToAdd = availableUsers.find(u => u._id === selectedMemberId)
      if (memberToAdd && !project.members.find(m => m._id === selectedMemberId)) {
        const updatedProject = {
          ...project,
          members: [...project.members, memberToAdd]
        }
        setProject(updatedProject)
        setSelectedMemberId('')
      }
    }
  }

  const handleRemoveMember = (memberId: string) => {
    if (project) {
      const updatedProject = {
        ...project,
        members: project.members.filter(m => m._id !== memberId)
      }
      setProject(updatedProject)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
              <p className="text-muted-foreground mb-4">Project ID: {params?.id}</p>
              <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="text-xl font-bold text-primary">DF Spaces</span>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => router.push('/profile')}>My Profile</Button>
                <Button variant="ghost" onClick={() => router.push('/people')}>People</Button>
                <Button variant="ghost" onClick={() => router.push('/projects')}>Projects</Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Welcome, {currentUser.name}</span>
                  <div className="text-xs text-muted-foreground">{currentUser.role} • {currentUser.email}</div>
                </div>
              )}
              <Button variant="outline" onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('mockUser')
                  window.location.href = '/'
                }
              }}>Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push('/projects')}>← Back to Projects</Button>
            {isAdmin && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleEdit}>Edit Project</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete Project</Button>
                  </>
                )}
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeline">Timeline</Label>
                    <Input
                      id="timeline"
                      value={editForm.timeline}
                      onChange={(e) => setEditForm({ ...editForm, timeline: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-3xl">{project.name}</CardTitle>
                  <CardDescription>
                    Created by {project.createdBy.name} on {new Date(project.createdAt).toLocaleDateString()}
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {!isEditing && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">{project.description}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Timeline</h3>
                    <p className="text-muted-foreground">{project.timeline}</p>
                  </div>
                </>
              )}

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Project Members</h3>
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <select 
                        className="p-2 border border-input rounded-md bg-background text-sm"
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                      >
                        <option value="">Add member...</option>
                        {availableUsers
                          .filter(user => !project.members.find(m => m._id === user._id))
                          .map(user => (
                            <option key={user._id} value={user._id}>
                              {user.name} ({user.email})
                            </option>
                          ))
                        }
                      </select>
                      <Button 
                        size="sm" 
                        onClick={handleAddMember}
                        disabled={!selectedMemberId}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.members.map((member) => (
                    <Card key={member._id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveMember(member._id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created by:</span>
                    <p className="font-medium">{project.createdBy.name}</p>
                    <p className="text-muted-foreground">{project.createdBy.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created on:</span>
                    <p className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 