import { describe, it, expect } from 'vitest'
import { buildSummaryPrompt, buildRecapPrompt } from '@/lib/prompt'
import { NormalizedEvent } from '@/lib/calendar/types'

describe('buildSummaryPrompt', () => {
  it('should build a complete prompt with all event data', () => {
    const event: NormalizedEvent = {
      id: 'test-event-1',
      provider: 'google',
      title: 'Team Standup',
      description: 'Daily team sync to discuss progress and blockers',
      startsAt: '2024-01-15T10:00:00.000Z',
      endsAt: '2024-01-15T10:30:00.000Z',
      attendees: [
        { name: 'John Doe', email: 'john@example.com', required: true },
        { name: 'Jane Smith', email: 'jane@example.com', required: true },
      ],
      organizer: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      location: 'Conference Room A',
      htmlLink: 'https://meet.google.com/abc-def-ghi',
    }

    const prompt = buildSummaryPrompt(event, 'America/Los_Angeles')

    expect(prompt).toContain('Team Standup')
    expect(prompt).toContain('John Doe')
    expect(prompt).toContain('Jane Smith')
    expect(prompt).toContain('Conference Room A')
    expect(prompt).toContain('Daily team sync')
    expect(prompt).toContain('summaryMd')
    expect(prompt).toContain('actionItems')
    expect(prompt).toContain('confidence')
  })

  it('should handle events with minimal data', () => {
    const event: NormalizedEvent = {
      id: 'test-event-2',
      provider: 'microsoft',
      title: 'Untitled Event',
      startsAt: '2024-01-15T14:00:00.000Z',
      endsAt: '2024-01-15T15:00:00.000Z',
      attendees: [],
    }

    const prompt = buildSummaryPrompt(event, 'America/New_York')

    expect(prompt).toContain('Untitled Event')
    expect(prompt).toContain('Attendees (0):')
    expect(prompt).toContain('Not specified')
    expect(prompt).toContain('No description provided')
  })

  it('should truncate long descriptions', () => {
    const longDescription = 'A'.repeat(2000)
    const event: NormalizedEvent = {
      id: 'test-event-3',
      provider: 'google',
      title: 'Long Meeting',
      description: longDescription,
      startsAt: '2024-01-15T14:00:00.000Z',
      endsAt: '2024-01-15T15:00:00.000Z',
      attendees: [],
    }

    const prompt = buildSummaryPrompt(event, 'UTC')

    expect(prompt).toContain('A'.repeat(1500))
    expect(prompt).toContain('...')
    expect(prompt.length).toBeLessThan(longDescription.length + 1000)
  })
})

describe('buildRecapPrompt', () => {
  it('should build a recap with multiple meetings', () => {
    const summaries = [
      {
        title: 'Morning Standup',
        time: '9:00 AM',
        summaryMd: '- Discussed project progress\n- Identified blockers',
        actionItems: ['John: Fix bug #123 — Due tomorrow', 'Jane: Review PR #456'],
      },
      {
        title: 'Client Meeting',
        time: '2:00 PM',
        summaryMd: '- Presented new features\n- Got client feedback',
        actionItems: [],
      },
    ]

    const recap = buildRecapPrompt(summaries, '2024-01-15')

    expect(recap).toContain('# Your DayBrief — 2024-01-15')
    expect(recap).toContain('## 9:00 AM — Morning Standup')
    expect(recap).toContain('## 2:00 PM — Client Meeting')
    expect(recap).toContain('John: Fix bug #123')
    expect(recap).toContain('- None') // For empty action items
    expect(recap).toContain('Sent by DayBrief')
  })

  it('should handle empty summaries list', () => {
    const recap = buildRecapPrompt([], '2024-01-15')

    expect(recap).toContain('# Your DayBrief — 2024-01-15')
    expect(recap).toContain('Sent by DayBrief')
  })
})
