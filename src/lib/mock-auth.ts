// Mock authentication system for development
export interface MockUser {
  id: string
  name: string
  email: string
  image?: string
  role: 'employee' | 'admin'
  bio?: string
  interests?: string[]
  avatar?: string
}

// Mock users data
export const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'John Employee',
    email: 'john@company.com',
    role: 'employee',
    bio: 'Software developer passionate about clean code',
    interests: ['JavaScript', 'React', 'TypeScript'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'Sarah Admin',
    email: 'sarah@company.com',
    role: 'admin',
    bio: 'Project manager with 10+ years of experience',
    interests: ['Project Management', 'Team Leadership', 'Agile'],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  }
]

// Mock session management
let currentUser: MockUser | null = null

// Helper function to check if we're in the browser
const isBrowser = typeof window !== 'undefined'

export const mockAuth = {
  signIn: (email: string) => {
    const user = mockUsers.find(u => u.email === email)
    if (user) {
      currentUser = user
      if (isBrowser) {
        localStorage.setItem('mockUser', JSON.stringify(user))
      }
      return user
    }
    return null
  },

  signOut: () => {
    currentUser = null
    if (isBrowser) {
      localStorage.removeItem('mockUser')
    }
  },

  getSession: () => {
    if (!currentUser && isBrowser) {
      try {
        const stored = localStorage.getItem('mockUser')
        if (stored) {
          currentUser = JSON.parse(stored)
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error)
      }
    }
    return currentUser ? {
      user: currentUser,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    } : null
  },

  isAdmin: () => {
    const session = mockAuth.getSession()
    return session?.user?.role === 'admin'
  },

  isEmployee: () => {
    const session = mockAuth.getSession()
    return session?.user?.role === 'employee'
  }
} 