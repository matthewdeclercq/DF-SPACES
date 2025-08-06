'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CompanyUser {
  id: string
  name: string
  email: string
  role: 'employee' | 'admin'
  bio?: string
  interests?: string[]
  avatar?: string
  department?: string
  position?: string
}

// Mock company users data
const mockCompanyUsers: CompanyUser[] = [
  {
    id: '1',
    name: 'John Employee',
    email: 'john@company.com',
    role: 'employee',
    bio: 'Software developer passionate about clean code and user experience. I love working on frontend technologies and creating intuitive interfaces.',
    interests: ['JavaScript', 'React', 'TypeScript', 'UI/UX Design'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    department: 'Engineering',
    position: 'Frontend Developer'
  },
  {
    id: '2',
    name: 'Sarah Admin',
    email: 'sarah@company.com',
    role: 'admin',
    bio: 'Project manager with 10+ years of experience in software development and team leadership. I specialize in agile methodologies and stakeholder management.',
    interests: ['Project Management', 'Team Leadership', 'Agile', 'Product Strategy'],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    department: 'Management',
    position: 'Project Manager'
  },
  {
    id: '3',
    name: 'Mike Developer',
    email: 'mike@company.com',
    role: 'employee',
    bio: 'Backend developer focused on scalable architecture and database design. I enjoy solving complex problems and optimizing system performance.',
    interests: ['Python', 'Node.js', 'Databases', 'System Architecture'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    department: 'Engineering',
    position: 'Backend Developer'
  },
  {
    id: '4',
    name: 'Lisa Designer',
    email: 'lisa@company.com',
    role: 'employee',
    bio: 'Creative designer with a passion for user-centered design. I specialize in creating beautiful, functional interfaces that enhance user experience.',
    interests: ['UI Design', 'UX Research', 'Prototyping', 'Design Systems'],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    department: 'Design',
    position: 'UI/UX Designer'
  },
  {
    id: '5',
    name: 'David Marketing',
    email: 'david@company.com',
    role: 'employee',
    bio: 'Marketing specialist focused on digital campaigns and brand strategy. I love data-driven marketing and creative storytelling.',
    interests: ['Digital Marketing', 'Brand Strategy', 'Analytics', 'Content Creation'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    department: 'Marketing',
    position: 'Marketing Specialist'
  },
  {
    id: '6',
    name: 'Emma HR',
    email: 'emma@company.com',
    role: 'employee',
    bio: 'HR professional dedicated to creating a positive workplace culture and supporting employee growth and development.',
    interests: ['Employee Development', 'Workplace Culture', 'Recruitment', 'HR Technology'],
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    department: 'Human Resources',
    position: 'HR Manager'
  }
]

export default function PeoplePage() {
  const router = useRouter()
  const [users] = useState<CompanyUser[]>(mockCompanyUsers)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  useEffect(() => {
    // Get current user from localStorage only in browser
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('mockUser')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setCurrentUser(user)
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error)
      }
    }
  }, [])

  // Get unique departments for filter
  const departments = ['all', ...Array.from(new Set(users.map(user => user.department || 'Other')))]

  // Filter users based on search term and department
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.bio?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment
    
    return matchesSearch && matchesDepartment
  })

  const handleViewProfile = (userId: string) => {
    router.push(`/people/${userId}`)
  }

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
            <h1 className="text-3xl font-bold">People</h1>
            <p className="text-muted-foreground">Connect with your colleagues</p>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, position, or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-input rounded-md bg-background"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full p-3 border border-input rounded-md bg-background"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* People Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewProfile(user.id)}>
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <span className="text-2xl font-bold text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl">{user.name}</CardTitle>
                  <CardDescription className="text-base font-medium">
                    {user.position}
                  </CardDescription>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm text-muted-foreground">{user.department}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {user.bio || 'No bio available'}
                  </p>
                  {user.interests && user.interests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Interests:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.interests.slice(0, 3).map((interest, index) => (
                          <span
                            key={index}
                            className="text-xs bg-secondary px-2 py-1 rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                        {user.interests.length > 3 && (
                          <span className="text-xs text-muted-foreground px-2 py-1">
                            +{user.interests.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{user.email}</span>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No people found matching your search criteria.</p>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Showing {filteredUsers.length} of {users.length} people</p>
          </div>
        </div>
      </main>
    </div>
  )
} 