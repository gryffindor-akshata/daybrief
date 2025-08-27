import { NormalizedEvent } from './types'

export interface MicrosoftCalendarEvent {
  id: string
  subject: string
  bodyPreview?: string
  body?: {
    content: string
    contentType: string
  }
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: {
    emailAddress: {
      address: string
      name?: string
    }
    type: string
  }[]
  organizer?: {
    emailAddress: {
      address: string
      name?: string
    }
  }
  location?: {
    displayName: string
  }
  webLink?: string
}

export async function fetchMicrosoftCalendarEvents(
  accessToken: string,
  date: string, // YYYY-MM-DD format
  timezone: string = 'America/Los_Angeles'
): Promise<NormalizedEvent[]> {
  const startDate = new Date(date + 'T00:00:00')
  const endDate = new Date(date + 'T23:59:59')
  
  const params = new URLSearchParams({
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    $orderby: 'start/dateTime',
    $top: '50',
  })

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarview?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Microsoft Graph API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  const events: MicrosoftCalendarEvent[] = data.value || []

  return events.map(normalizeMicrosoftEvent)
}

function normalizeMicrosoftEvent(event: MicrosoftCalendarEvent): NormalizedEvent {
  return {
    id: event.id,
    provider: 'microsoft',
    title: event.subject || 'Untitled Event',
    description: event.body?.content || event.bodyPreview,
    startsAt: event.start.dateTime,
    endsAt: event.end.dateTime,
    attendees: (event.attendees || []).map(attendee => ({
      name: attendee.emailAddress.name,
      email: attendee.emailAddress.address,
      required: attendee.type === 'required',
    })),
    organizer: event.organizer ? {
      name: event.organizer.emailAddress.name,
      email: event.organizer.emailAddress.address,
    } : undefined,
    location: event.location?.displayName,
    htmlLink: event.webLink,
  }
}

export async function refreshMicrosoftToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.MS_CLIENT_ID!,
      client_secret: process.env.MS_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'openid email profile offline_access Calendars.Read',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Microsoft token')
  }

  const data = await response.json()
  return data.access_token
}
