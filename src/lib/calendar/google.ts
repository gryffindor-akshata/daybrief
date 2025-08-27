import { NormalizedEvent } from './types'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  attendees?: {
    email: string
    displayName?: string
    responseStatus?: string
    optional?: boolean
  }[]
  organizer?: {
    email: string
    displayName?: string
  }
  location?: string
  htmlLink?: string
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  date: string, // YYYY-MM-DD format
  timezone: string = 'America/Los_Angeles'
): Promise<NormalizedEvent[]> {
  const startDate = new Date(date + 'T00:00:00')
  const endDate = new Date(date + 'T23:59:59')
  
  const params = new URLSearchParams({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Calendar API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  const events: GoogleCalendarEvent[] = data.items || []

  return events.map(normalizeGoogleEvent)
}

function normalizeGoogleEvent(event: GoogleCalendarEvent): NormalizedEvent {
  return {
    id: event.id,
    provider: 'google',
    title: event.summary || 'Untitled Event',
    description: event.description,
    startsAt: event.start.dateTime || event.start.date + 'T00:00:00',
    endsAt: event.end.dateTime || event.end.date + 'T23:59:59',
    attendees: (event.attendees || []).map(attendee => ({
      name: attendee.displayName,
      email: attendee.email,
      required: !attendee.optional,
    })),
    organizer: event.organizer ? {
      name: event.organizer.displayName,
      email: event.organizer.email,
    } : undefined,
    location: event.location,
    htmlLink: event.htmlLink,
  }
}

export async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Google token')
  }

  const data = await response.json()
  return data.access_token
}
