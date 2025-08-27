import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchGoogleCalendarEvents } from '@/lib/calendar/google'
import { fetchMicrosoftCalendarEvents } from '@/lib/calendar/microsoft'
import { PrismaClient } from '@prisma/client'
import { NormalizedEvent } from '@/lib/calendar/types'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // Get user and account info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const account = await prisma.account.findFirst({
      where: { userId: user.id },
    })

    if (!account?.access_token) {
      return NextResponse.json({ error: 'No calendar access' }, { status: 403 })
    }

    let events: NormalizedEvent[] = []

    try {
      if (account.provider === 'google') {
        events = await fetchGoogleCalendarEvents(account.access_token, date, user.timezone)
      } else if (account.provider === 'microsoft') {
        events = await fetchMicrosoftCalendarEvents(account.access_token, date, user.timezone)
      } else {
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
      }
    } catch (error) {
      console.error('Calendar API error:', error)
      
      // Try to refresh token if it's expired
      if (account.refresh_token && error instanceof Error && error.message.includes('401')) {
        try {
          let newAccessToken: string
          
          if (account.provider === 'google') {
            const { refreshGoogleToken } = await import('@/lib/calendar/google')
            newAccessToken = await refreshGoogleToken(account.refresh_token)
          } else {
            const { refreshMicrosoftToken } = await import('@/lib/calendar/microsoft')
            newAccessToken = await refreshMicrosoftToken(account.refresh_token)
          }

          // Update the token in database
          await prisma.account.update({
            where: { id: account.id },
            data: { access_token: newAccessToken },
          })

          // Retry the request
          if (account.provider === 'google') {
            events = await fetchGoogleCalendarEvents(newAccessToken, date, user.timezone)
          } else {
            events = await fetchMicrosoftCalendarEvents(newAccessToken, date, user.timezone)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          return NextResponse.json({ 
            error: 'Calendar access expired. Please sign in again.' 
          }, { status: 403 })
        }
      } else {
        return NextResponse.json({ 
          error: 'Failed to fetch calendar events',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
