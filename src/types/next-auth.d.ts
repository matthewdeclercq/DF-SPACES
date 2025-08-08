import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string
      isAdmin?: boolean
      role?: 'user' | 'admin'
    }
  }

  interface User {
    id: string
    isAdmin?: boolean
    role?: 'user' | 'admin'
  }
} 