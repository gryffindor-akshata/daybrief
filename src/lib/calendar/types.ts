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
  attachments?: DocumentAttachment[]
}

export interface DocumentAttachment {
  id: string
  title: string
  url: string
  type: 'google_doc' | 'google_sheet' | 'pdf' | 'other'
  content?: string // Will be populated when document is fetched
}

export type SummaryOutput = {
  summaryMd: string
  actionItems: string[]
  confidence: number
}
