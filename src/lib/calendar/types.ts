export type NormalizedEvent = {
  id: string
  provider: 'google' | 'microsoft'
  title: string
  description?: string
  startsAt: string // ISO
  endsAt: string   // ISO
  attendees: {name?: string; email?: string; required?: boolean}[]
  organizer?: {name?: string; email?: string}
  location?: string
  htmlLink?: string
}

export type SummaryOutput = {
  summaryMd: string
  actionItems: string[]
  confidence: number
}
