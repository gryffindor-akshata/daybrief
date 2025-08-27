import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchGoogleCalendarEvents, fetchMicrosoftCalendarEvents } from '@/lib/calendar/google'

// Mock fetch globally
global.fetch = vi.fn()

describe('Google Calendar Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should fetch and normalize Google Calendar events', async () => {
    const mockResponse = {
      items: [
        {
          id: 'google-event-1',
          summary: 'Test Meeting',
          description: 'A test meeting',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
          attendees: [
            {
              email: 'test@example.com',
              displayName: 'Test User',
              responseStatus: 'accepted',
              optional: false,
            },
          ],
          organizer: {
            email: 'organizer@example.com',
            displayName: 'Organizer',
          },
          location: 'Meeting Room',
          htmlLink: 'https://calendar.google.com/event',
        },
      ],
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const events = await fetchGoogleCalendarEvents(
      'test-token',
      '2024-01-15',
      'America/Los_Angeles'
    )

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      id: 'google-event-1',
      provider: 'google',
      title: 'Test Meeting',
      description: 'A test meeting',
      startsAt: '2024-01-15T10:00:00Z',
      endsAt: '2024-01-15T11:00:00Z',
      location: 'Meeting Room',
      htmlLink: 'https://calendar.google.com/event',
    })
    expect(events[0].attendees).toHaveLength(1)
    expect(events[0].attendees[0]).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      required: true,
    })
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    } as Response)

    await expect(
      fetchGoogleCalendarEvents('invalid-token', '2024-01-15')
    ).rejects.toThrow('Google Calendar API error: 401')
  })

  it('should handle empty events list', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    } as Response)

    const events = await fetchGoogleCalendarEvents('test-token', '2024-01-15')
    expect(events).toHaveLength(0)
  })

  it('should handle all-day events', async () => {
    const mockResponse = {
      items: [
        {
          id: 'all-day-event',
          summary: 'All Day Event',
          start: { date: '2024-01-15' },
          end: { date: '2024-01-16' },
        },
      ],
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const events = await fetchGoogleCalendarEvents('test-token', '2024-01-15')

    expect(events[0].startsAt).toBe('2024-01-15T00:00:00')
    expect(events[0].endsAt).toBe('2024-01-16T23:59:59')
  })
})
