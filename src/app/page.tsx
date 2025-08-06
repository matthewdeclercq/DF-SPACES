'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

  const handleSignIn = () => {
    if (selectedUser) {
      // Simple mock sign in - just store in localStorage
      const user = mockUsers.find(u => u.email === selectedUser)
      if (user) {
        localStorage.setItem('mockUser', JSON.stringify(user))
        router.push('/profile')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            DF Spaces
          </CardTitle>
          <CardDescription className="text-lg">
            Welcome to your company intranet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Select a user to sign in (Mock Authentication)
          </p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose User:</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-2 border border-input rounded-md bg-background"
            >
              <option value="">Select a user...</option>
              {mockUsers.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleSignIn}
            disabled={!selectedUser}
            className="w-full"
            size="lg"
          >
            Sign In
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            <p><strong>John Employee:</strong> Can edit profile and view projects</p>
            <p><strong>Sarah Admin:</strong> Can edit profile, create/delete projects</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 