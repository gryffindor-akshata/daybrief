import { NormalizedEvent } from './calendar/types'

export function buildSummaryPrompt(event: NormalizedEvent, timezone: string): string {
  const startTime = new Date(event.startsAt).toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  
  const endTime = new Date(event.endsAt).toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const attendeeCount = event.attendees.length
  const topAttendees = event.attendees
    .slice(0, 5)
    .map(a => a.name || a.email)
    .join(', ')
  
  const moreAttendees = attendeeCount > 5 ? `, +${attendeeCount - 5} more` : ''
  
  const description = event.description 
    ? truncateText(event.description, 1500)
    : 'No description provided'
  
  // Include document content if available
  const documentContent = event.attachments && event.attachments.length > 0
    ? event.attachments
        .filter(att => att.content && att.content.trim().length > 0)
        .map(att => `\n--- ${att.title} ---\n${truncateText(att.content!, 3000)}`)
        .join('\n')
    : ''

  return `Context:
- Title: ${event.title}
- Time: ${startTime}–${endTime} (${timezone})
- Organizer: ${event.organizer?.name || 'Unknown'} <${event.organizer?.email || 'Unknown'}>
- Attendees (${attendeeCount}): ${topAttendees}${moreAttendees}
- Location/Link: ${event.location || event.htmlLink || 'Not specified'}
- Description/Agenda:
${description}${documentContent ? `

Document Content:${documentContent}` : ''}

Tasks:
1) Produce a crisp summary in 4–7 bullets focused on purpose, decisions, and outcomes${documentContent ? '. Include insights from attached documents.' : ''}.
2) Extract explicit action items as a JSON array of strings: ["Owner: Task — Due (if any)", ...]. Include action items from both meeting context and attached documents. If none, return [].
3) Provide a confidence score [0.0–1.0] based on clarity/amount of context.

Output JSON strictly as:
{
  "summaryMd": "markdown bullets only",
  "actionItems": ["..."],
  "confidence": 0.0
}`
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  
  return text.substring(0, maxLength).trim() + '...'
}

export function buildRecapPrompt(
  summaries: Array<{
    title: string
    time: string
    summaryMd: string
    actionItems: string[]
  }>,
  date: string
): string {
  const meetingsSection = summaries.map(summary => `
## ${summary.time} — ${summary.title}
${summary.summaryMd}

**Action Items**
${summary.actionItems.length > 0 
  ? summary.actionItems.map(item => `- ${item}`).join('\n')
  : '- None'
}
  `).join('\n')

  return `# Your DayBrief — ${date}

${meetingsSection}

—
Sent by DayBrief • [Update Settings](${process.env.NEXTAUTH_URL}/settings)`
}
