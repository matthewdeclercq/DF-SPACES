'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Layout from '@/components/Layout'
import { Users, UserPlus, Shield, UserX, Trash2, Edit } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet'
import { mockUsers } from '@/lib/mock-auth'

interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  isAdmin: boolean
  createdAt?: string
}

interface MockUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [appMode, setAppMode] = useState<'mock' | 'real' | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [mockUsers, setMockUsers] = useState<MockUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [newMockUser, setNewMockUser] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin'
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [isAddingMockUser, setIsAddingMockUser] = useState(false)

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
      fetchUsers()
      if (appMode === 'mock') {
        fetchMockUsers()
      }
    }
  }, [isAdmin, appMode])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMockUsers = async () => {
    try {
      const response = await fetch('/api/admin/mock-users', {
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        setMockUsers(data)
      }
    } catch (error) {
      console.error('Error fetching mock users:', error)
    }
  }

  const handleToggleAdmin = async (userId: string, currentRole: 'user' | 'admin') => {
    // Prevent removing admin from self
    const isCurrentUser = appMode === 'mock' 
      ? currentUser?.id === userId 
      : session?.user?.id === userId

    if (isCurrentUser && currentRole === 'admin') {
      alert('You cannot remove admin privileges from yourself')
      return
    }

    try {
      setIsUpdatingUser(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
        },
        body: JSON.stringify({
          role: currentRole === 'admin' ? 'user' : 'admin',
          isAdmin: currentRole === 'user'
        })
      })

      if (response.ok) {
        fetchUsers()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
    } finally {
      setIsUpdatingUser(false)
    }
  }

  const handleAddMockUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMockUser.name.trim() || !newMockUser.email.trim()) {
      alert('Name and email are required')
      return
    }

    try {
      setIsAddingMockUser(true)
      const response = await fetch('/api/admin/mock-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
        },
        body: JSON.stringify(newMockUser)
      })

      if (response.ok) {
        setNewMockUser({ name: '', email: '', role: 'user' })
        fetchMockUsers()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to add mock user')
      }
    } catch (error) {
      console.error('Error adding mock user:', error)
      alert('Error adding mock user')
    } finally {
      setIsAddingMockUser(false)
    }
  }

  const handleDeleteMockUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this mock user?')) return

    try {
      const response = await fetch(`/api/admin/mock-users/${userId}`, {
        method: 'DELETE',
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })

      if (response.ok) {
        fetchMockUsers()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete mock user')
      }
    } catch (error) {
      console.error('Error deleting mock user:', error)
      alert('Error deleting mock user')
    }
  }

  const handleEditMockUser = async (userId: string, updates: Partial<MockUser>) => {
    try {
      const response = await fetch(`/api/admin/mock-users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        fetchMockUsers()
        setEditingUser(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update mock user')
      }
    } catch (error) {
      console.error('Error updating mock user:', error)
      alert('Error updating mock user')
    }
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
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and admin privileges</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4 mr-1" />
              <span>Users</span>
            </TabsTrigger>
            {appMode === 'mock' && (
              <TabsTrigger value="mock-users" className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4 mr-1" />
                <span>Mock Users</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>System Users</CardTitle>
                <CardDescription>
                  Manage user roles and admin privileges. You cannot remove admin privileges from yourself.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isCurrentUser = appMode === 'mock' 
                        ? currentUser?.id === user._id 
                        : session?.user?.id === user._id

                      return (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                              {user.role === 'admin' ? 'Admin' : 'User'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={user.role === 'admin' ? "destructive" : "outline"}
                              onClick={() => handleToggleAdmin(user._id, user.role)}
                              disabled={isUpdatingUser || (isCurrentUser && user.role === 'admin')}
                            >
                              {user.role === 'admin' ? (
                                <>
                                  <UserX className="h-4 w-4 mr-1" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mock Users Tab */}
          {appMode === 'mock' && (
            <TabsContent value="mock-users">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Mock User</CardTitle>
                    <CardDescription>Create a new mock user for testing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddMockUser} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={newMockUser.name}
                          onChange={(e) => setNewMockUser(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newMockUser.email}
                          onChange={(e) => setNewMockUser(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@company.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <select
                          id="role"
                          value={newMockUser.role}
                          onChange={(e) => setNewMockUser(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                          className="w-full p-2 border border-input rounded-md bg-background"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <Button type="submit" className="w-full" disabled={isAddingMockUser}>
                        {isAddingMockUser ? 'Adding...' : 'Add Mock User'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mock Users</CardTitle>
                    <CardDescription>Manage existing mock users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockUsers.map((user) => {
                        const isPredefined = mockUsers.some(predefined => predefined.id === user.id)
                        return (
                          <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                                  {user.role === 'admin' ? 'Admin' : 'User'}
                                </Badge>
                                {isPredefined && (
                                  <Badge variant="outline" className="text-xs">
                                    Predefined
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </SheetTrigger>
                              <SheetContent>
                                <SheetHeader>
                                  <SheetTitle>Edit Mock User</SheetTitle>
                                  <SheetDescription>
                                    Update user details
                                  </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-4 mt-4">
                                  <div>
                                    <Label>Name</Label>
                                    <Input
                                      value={user.name}
                                      onChange={(e) => {
                                        const updatedUser = { ...user, name: e.target.value }
                                        setMockUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u))
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <Input
                                      value={user.email}
                                      onChange={(e) => {
                                        const updatedUser = { ...user, email: e.target.value }
                                        setMockUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u))
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label>Role</Label>
                                    <select
                                      value={user.role}
                                      onChange={(e) => {
                                        const updatedUser = { ...user, role: e.target.value as 'user' | 'admin' }
                                        setMockUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u))
                                      }}
                                      className="w-full p-2 border border-input rounded-md bg-background"
                                    >
                                      <option value="user">User</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  </div>
                                  <SheetFooter>
                                    <Button 
                                      onClick={() => handleEditMockUser(user.id, user)}
                                      className="w-full"
                                    >
                                      Save Changes
                                    </Button>
                                  </SheetFooter>
                                </div>
                              </SheetContent>
                            </Sheet>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteMockUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )})}
                      {mockUsers.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No mock users yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  )
}
