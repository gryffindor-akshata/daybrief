import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaClient } from '@prisma/client'
import { env } from './zenv'

const prisma = new PrismaClient()

const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  debug: true,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/drive.readonly',
          access_type: 'offline',
          prompt: 'consent',
          response_type: 'code',
        },
      },
    }),
  ],
  experimental: {
    enableWebAuthn: false,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !user.email) return false

      try {
        // Check if user exists
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!dbUser) {
          // Create new user
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              provider: account.provider,
              providerId: account.providerAccountId,
              timezone: 'America/Los_Angeles', // Default, will be updated in settings
            },
          })
        }

        // Store or update account info
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          create: {
            userId: dbUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state as string,
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
          },
        })

        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
        token.providerId = account.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        })
        
        if (dbUser) {
          session.user.id = dbUser.id
          session.user.provider = dbUser.provider
          session.user.providerId = dbUser.providerId
          session.user.timezone = dbUser.timezone
        }
      }
      
      session.accessToken = token.accessToken as string
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
})

export { handlers, auth, signIn, signOut }

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

export async function updateUserSettings(
  userId: string,
  settings: {
    timezone?: string
    recapEmail?: boolean
    recapSlack?: boolean
    slackUserId?: string
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data: settings,
  })
}
