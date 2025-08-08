import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Optional: Restrict to company domain
      if (process.env.ALLOWED_EMAIL_DOMAIN) {
        const emailDomain = user.email?.split('@')[1]
        if (emailDomain !== process.env.ALLOWED_EMAIL_DOMAIN) {
          return false
        }
      }
      return true
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
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