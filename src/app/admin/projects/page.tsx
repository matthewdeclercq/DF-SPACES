'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Layout from '@/components/Layout'
import { FolderOpen, Plus, Edit, Trash2, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet'

interface Project {
  _id: string
  name: string
  description: string
  members: Array<{ _id: string; name: string; email: string }>
  createdBy: { _id: string; name: string; email: string }
  createdAt: string
}

interface User {
  _id: string
  name: string
  email: string
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [appMode, setAppMode] = useState<'mock' | 'real' | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    members: [] as string[]
  })
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    members: [] as string[]
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

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
    if (appMode === null) return
    if (appMode === 'mock') {
      if (typeof window !== 'undefined') {
        try {
          const storedUser = localStorage.getItem('mockUser')
          if (storedUser) {
            const user = JSON.parse(storedUser)
            setCurrentUser(user)
            setIsAdmin(user.role === 'admin')
            if (user.role !== 'admin') router.push('/profile')
          } else {
            setIsAdmin(false)
          }
        } catch (error) {
          console.error('Error reading from localStorage:', error)
        }
      }
    } else {
      // real mode - rely on next-auth
      if (status === 'authenticated' && session?.user) {
        setIsAdmin(Boolean(session.user.isAdmin) || session.user.role === 'admin')
        setCurrentUser(null)
        if (!(Boolean(session.user.isAdmin) || session.user.role === 'admin')) {
          router.push('/profile')
        }
      } else if (status === 'unauthenticated') {
        router.push('/')
      }
    }
  }, [appMode, session, status, router])

  useEffect(() => {
    if (isAdmin) {
      fetchProjects()
      fetchUsers()
    }
  }, [isAdmin])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name.trim() || !newProject.description.trim()) {
      alert('Name and description are required')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
        },
        body: JSON.stringify({
          name: newProject.name.trim(),
          description: newProject.description.trim(),
          members: newProject.members
        })
      })

      if (response.ok) {
        setNewProject({ name: '', description: '', members: [] })
        setIsCreateSheetOpen(false)
        fetchProjects()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Error creating project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditProject = async (projectId: string) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim(),
          members: editForm.members
        })
      })

      if (response.ok) {
        setEditingProject(null)
        setEditForm({ name: '', description: '', members: [] })
        setIsEditSheetOpen(false)
        fetchProjects()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Error updating project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      setIsDeleting(projectId)
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })

      if (response.ok) {
        fetchProjects()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Error deleting project')
    } finally {
      setIsDeleting(null)
    }
  }

  const startEdit = (project: Project) => {
    setEditingProject(project)
    setEditForm({
      name: project.name,
      description: project.description,
      members: project.members.map(m => m._id)
    })
    setIsEditSheetOpen(true)
  }

  const addMember = (projectId: string, userId: string) => {
    if (projectId === 'new') {
      setNewProject(prev => ({
        ...prev,
        members: [...prev.members, userId]
      }))
    } else {
      setEditForm(prev => ({
        ...prev,
        members: [...prev.members, userId]
      }))
    }
  }

  const removeMember = (projectId: string, userId: string) => {
    if (projectId === 'new') {
      setNewProject(prev => ({
        ...prev,
        members: prev.members.filter(id => id !== userId)
      }))
    } else {
      setEditForm(prev => ({
        ...prev,
        members: prev.members.filter(id => id !== userId)
      }))
    }
  }

  const getSelectedMembers = (projectId: string) => {
    if (projectId === 'new') {
      return newProject.members.map(id => users.find(u => u._id === id)).filter(Boolean) as User[]
    } else {
      return editForm.members.map(id => users.find(u => u._id === id)).filter(Boolean) as User[]
    }
  }

  const getAvailableUsers = (projectId: string) => {
    const selectedMembers = getSelectedMembers(projectId)
    return users.filter(user => !selectedMembers.find(m => m._id === user._id))
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Admin access required</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading projects...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">Create and manage company projects</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Projects</h2>
            <p className="text-muted-foreground">Manage all company projects</p>
          </div>
          <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> New Project
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[600px]">
              <SheetHeader>
                <SheetTitle>Create New Project</SheetTitle>
                <SheetDescription>Add a new project to the company portfolio</SheetDescription>
              </SheetHeader>
              <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Website Redesign"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the project goals and scope..."
                    required
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Team Members</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {getSelectedMembers('new').map((member) => (
                        <Badge key={member._id} variant="secondary" className="flex items-center gap-1">
                          {member.name}
                          <button
                            type="button"
                            onClick={() => removeMember('new', member._id)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <select
                      className="w-full p-2 border border-input rounded-md bg-background"
                      onChange={(e) => {
                        if (e.target.value) {
                          addMember('new', e.target.value)
                          e.target.value = ''
                        }
                      }}
                      value=""
                    >
                      <option value="">Add team member...</option>
                      {getAvailableUsers('new').map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <SheetFooter>
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? 'Creating...' : 'Create Project'}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Description</TableHead>

                  <TableHead>Members</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project._id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate">{project.description}</p>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{project.members.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>{project.createdBy.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(project)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProject(project._id)}
                          disabled={isDeleting === project._id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {isDeleting === project._id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Project Sheet */}
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetContent side="right" className="w-[600px]">
            <SheetHeader>
              <SheetTitle>Edit Project</SheetTitle>
              <SheetDescription>Update project details and team members</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Project Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Project name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Project description"
                  rows={4}
                />
              </div>

              <div>
                <Label>Team Members</Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {getSelectedMembers('edit').map((member) => (
                      <Badge key={member._id} variant="secondary" className="flex items-center gap-1">
                        {member.name}
                        <button
                          type="button"
                          onClick={() => removeMember('edit', member._id)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <select
                    className="w-full p-2 border border-input rounded-md bg-background"
                    onChange={(e) => {
                      if (e.target.value) {
                        addMember('edit', e.target.value)
                        e.target.value = ''
                      }
                    }}
                    value=""
                  >
                    <option value="">Add team member...</option>
                    {getAvailableUsers('edit').map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <SheetFooter>
                <Button 
                  onClick={() => editingProject && handleEditProject(editingProject._id)}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>

        {projects.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">Create your first project to get started</p>
              <Button onClick={() => setIsCreateSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
