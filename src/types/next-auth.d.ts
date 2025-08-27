import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      provider?: string
      providerId?: string
      timezone?: string
    } & DefaultSession['user']
    accessToken?: string
  }

  interface User {
    provider?: string
    providerId?: string
    timezone?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    provider?: string
    providerId?: string
  }
}
