'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  startDate?: string
  location?: string
  skills?: string[]
}

// Mock company users data (same as people page)
const mockCompanyUsers: CompanyUser[] = [
  {
    id: '1',
    name: 'John Employee',
    email: 'john@company.com',
    role: 'employee',
    bio: 'Software developer passionate about clean code and user experience. I love working on frontend technologies and creating intuitive interfaces that users love to interact with. With 5+ years of experience in web development, I specialize in React, TypeScript, and modern CSS frameworks.',
    interests: ['JavaScript', 'React', 'TypeScript', 'UI/UX Design', 'Open Source', 'Tech Conferences'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    department: 'Engineering',
    position: 'Frontend Developer',
    startDate: '2022-03-15',
    location: 'San Francisco, CA',
    skills: ['React', 'TypeScript', 'JavaScript', 'CSS3', 'HTML5', 'Git', 'REST APIs', 'Responsive Design']
  },
  {
    id: '2',
    name: 'Sarah Admin',
    email: 'sarah@company.com',
    role: 'admin',
    bio: 'Project manager with 10+ years of experience in software development and team leadership. I specialize in agile methodologies and stakeholder management, helping teams deliver high-quality products on time and within budget.',
    interests: ['Project Management', 'Team Leadership', 'Agile', 'Product Strategy', 'Process Improvement', 'Mentoring'],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    department: 'Management',
    position: 'Project Manager',
    startDate: '2020-01-10',
    location: 'New York, NY',
    skills: ['Agile', 'Scrum', 'JIRA', 'Confluence', 'Risk Management', 'Stakeholder Management', 'Team Building']
  },
  {
    id: '3',
    name: 'Mike Developer',
    email: 'mike@company.com',
    role: 'employee',
    bio: 'Backend developer focused on scalable architecture and database design. I enjoy solving complex problems and optimizing system performance to ensure our applications run smoothly at scale.',
    interests: ['Python', 'Node.js', 'Databases', 'System Architecture', 'Cloud Computing', 'DevOps'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    department: 'Engineering',
    position: 'Backend Developer',
    startDate: '2021-06-20',
    location: 'Austin, TX',
    skills: ['Python', 'Node.js', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Microservices']
  },
  {
    id: '4',
    name: 'Lisa Designer',
    email: 'lisa@company.com',
    role: 'employee',
    bio: 'Creative designer with a passion for user-centered design. I specialize in creating beautiful, functional interfaces that enhance user experience and drive business results.',
    interests: ['UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'User Testing', 'Design Thinking'],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    department: 'Design',
    position: 'UI/UX Designer',
    startDate: '2023-01-15',
    location: 'Seattle, WA',
    skills: ['Figma', 'Sketch', 'Adobe Creative Suite', 'Prototyping', 'User Research', 'Design Systems', 'Accessibility']
  },
  {
    id: '5',
    name: 'David Marketing',
    email: 'david@company.com',
    role: 'employee',
    bio: 'Marketing specialist focused on digital campaigns and brand strategy. I love data-driven marketing and creative storytelling that connects with our target audience.',
    interests: ['Digital Marketing', 'Brand Strategy', 'Analytics', 'Content Creation', 'Social Media', 'Growth Hacking'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    department: 'Marketing',
    position: 'Marketing Specialist',
    startDate: '2022-09-01',
    location: 'Chicago, IL',
    skills: ['Google Analytics', 'Facebook Ads', 'SEO', 'Content Marketing', 'Email Marketing', 'A/B Testing', 'CRM']
  },
  {
    id: '6',
    name: 'Emma HR',
    email: 'emma@company.com',
    role: 'employee',
    bio: 'HR professional dedicated to creating a positive workplace culture and supporting employee growth and development. I believe that happy employees are the foundation of a successful company.',
    interests: ['Employee Development', 'Workplace Culture', 'Recruitment', 'HR Technology', 'Diversity & Inclusion', 'Wellness Programs'],
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    department: 'Human Resources',
    position: 'HR Manager',
    startDate: '2021-03-01',
    location: 'Boston, MA',
    skills: ['Recruitment', 'Employee Relations', 'Performance Management', 'HRIS', 'Benefits Administration', 'Compliance', 'Training & Development']
  }
]

export default function UserProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<CompanyUser | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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

  useEffect(() => {
    if (mounted) {
      // Get user ID from URL path
      const pathSegments = window.location.pathname.split('/')
      const userId = pathSegments[pathSegments.length - 1]
      
      // Find user in mock data
      const foundUser = mockCompanyUsers.find(u => u.id === userId)
      if (foundUser) {
        setUser(foundUser)
      }
    }
  }, [mounted])

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
              <Button onClick={() => router.push('/people')}>Back to People</Button>
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
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.push('/people')}>← Back to People</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Header */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-6">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                        <span className="text-4xl font-bold text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-3xl">{user.name}</CardTitle>
                  <CardDescription className="text-xl font-medium">
                    {user.position}
                  </CardDescription>
                  <div className="flex items-center justify-center space-x-4 mt-4">
                    <span className="text-muted-foreground">{user.department}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {user.bio || 'No bio available'}
                  </p>
                </CardContent>
              </Card>

              {/* Skills */}
              {user.skills && user.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-secondary px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Interests */}
              {user.interests && user.interests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  {user.location && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="text-sm">{user.location}</p>
                    </div>
                  )}
                  {user.startDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p className="text-sm">{new Date(user.startDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" size="sm">
                    Send Message
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    View Projects
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 