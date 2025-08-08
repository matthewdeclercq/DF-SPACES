import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import mongoose from 'mongoose'
import User from '@/models/User'

const APP_MODE = process.env.APP_MODE === 'mock' ? 'mock' : 'real'

const handler = NextAuth({
  providers: [
    ...(APP_MODE === 'real'
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : [
          // Keep a placeholder Google provider in mock mode; UI will use mock login
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || 'mock-client-id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret',
          }),
        ]),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const email = user?.email || token?.email
      let isAdmin = false
      let role: 'user' | 'admin' | undefined = undefined
      try {
        if (email) {
          if (!mongoose.connections[0]?.readyState && process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI)
          }
          if (mongoose.connections[0]?.readyState) {
            const dbUser = await User.findOne({ email }).select('role isAdmin')
            if (dbUser) {
              role = (dbUser.role as 'user' | 'admin') || (dbUser.isAdmin ? 'admin' : 'user')
              isAdmin = dbUser.isAdmin || role === 'admin'
            }
          }
        }
      } catch {
        // ignore
      }
      if (!role && email && APP_MODE === 'real') {
        isAdmin = email === 'm_declercq@digitalfoundry.com'
        role = isAdmin ? 'admin' : 'user'
      }
      return { ...token, isAdmin, role }
    },
    async signIn({ user }) {
      if (APP_MODE === 'real') {
        const allowed = process.env.ALLOWED_EMAIL_DOMAIN
        if (allowed) {
          const emailDomain = user.email?.split('@')[1]
          if (emailDomain !== allowed) return false
        }
        try {
          if (!mongoose.connections[0]?.readyState && process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI)
          }
          if (mongoose.connections[0]?.readyState && user.email) {
            const makeAdmin = user.email === 'm_declercq@digitalfoundry.com'
            await User.findOneAndUpdate(
              { email: user.email },
              {
                $setOnInsert: {
                  name: user.name || user.email,
                  email: user.email,
                  image: user.image || '',
                },
                $set: {
                  role: makeAdmin ? 'admin' : 'user',
                  isAdmin: makeAdmin,
                },
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            )
          }
        } catch {
          // ignore
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        const anyToken = token as unknown as { sub?: string; isAdmin?: boolean; role?: 'user' | 'admin' }
        session.user.id = anyToken.sub || session.user.id
        session.user.isAdmin = Boolean(anyToken.isAdmin)
        if (anyToken.role) session.user.role = anyToken.role
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST } 