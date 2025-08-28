import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateSummary } from '@/lib/llm'
import { buildSummaryPrompt } from '@/lib/prompt'
import { PrismaClient } from '@prisma/client'
import { NormalizedEvent } from '@/lib/calendar/types'
import { fetchGoogleDocContent } from '@/lib/calendar/docs'
import { z } from 'zod'

const prisma = new PrismaClient()

const summarizeRequestSchema = z.object({
  event: z.object({
    id: z.string(),
    provider: z.enum(['google', 'microsoft']),
    title: z.string(),
    description: z.string().optional(),
    startsAt: z.string(),
    endsAt: z.string(),
    attendees: z.array(z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      required: z.boolean().optional(),
    })),
    location: z.string().optional(),
    organizer: z.object({
      name: z.string().optional(),
      email: z.string().optional(),
    }).optional(),
    htmlLink: z.string().optional(),
    attachments: z.array(z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      type: z.enum(['google_doc', 'google_sheet', 'pdf', 'other']),
      content: z.string().optional(),
    })).optional(),
  }),
  regenerate: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { event, regenerate } = summarizeRequestSchema.parse(body)

    // Check if summary already exists
    const eventDate = new Date(event.startsAt)
    const localDate = new Date(eventDate.toLocaleDateString())

    const existingSummary = await prisma.summary.findFirst({
      where: {
        userId: user.id,
        eventId: event.id,
        provider: event.provider,
        date: localDate,
      },
    })

    if (existingSummary && !regenerate && existingSummary.finalized) {
      return NextResponse.json({
        summaryMd: existingSummary.summaryMd,
        actionItems: JSON.parse(existingSummary.actionItems),
        confidence: existingSummary.confidence,
      })
    }

    // Fetch document content if there are Google Doc attachments
    if (event.attachments && event.attachments.length > 0) {
      console.log('Found attachments:', event.attachments.length)
      const accessToken = session.accessToken
      console.log('Access token available:', !!accessToken)
      
      // Check token scopes by making a test Drive API call
      if (accessToken) {
        try {
          const testResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
          console.log('Drive API test response status:', testResponse.status)
          if (!testResponse.ok) {
            const errorText = await testResponse.text()
            console.log('Drive API test error:', errorText)
          }
        } catch (error) {
          console.log('Drive API test failed:', error)
        }
      }
      
      if (accessToken) {
        for (const attachment of event.attachments) {
          console.log(`Processing attachment: ${attachment.type}, ID: ${attachment.id}`)
          if (attachment.type === 'google_doc' && !attachment.content) {
            try {
              console.log(`Fetching Google Doc content for: ${attachment.id}`)
              const docContent = await fetchGoogleDocContent(accessToken, attachment.id)
              if (docContent) {
                console.log(`Fetched document content: ${docContent.content.length} characters`)
                attachment.content = docContent.content
              } else {
                console.log(`No content returned for document: ${attachment.id}`)
              }
            } catch (error) {
              console.error(`Failed to fetch document ${attachment.id}:`, error)
            }
          }
        }
      } else {
        console.log('No access token available for document fetching')
      }
    } else {
      console.log('No attachments found for this event')
    }

    // Generate new summary
    const prompt = buildSummaryPrompt(event, user.timezone)
    const summaryOutput = await generateSummary(prompt)

    // Store in database
    const summary = await prisma.summary.upsert({
      where: {
        userId_eventId_provider: {
          userId: user.id,
          eventId: event.id,
          provider: event.provider,
        },
      },
      create: {
        userId: user.id,
        date: localDate,
        eventId: event.id,
        provider: event.provider,
        title: event.title,
        startsAt: new Date(event.startsAt),
        endsAt: new Date(event.endsAt),
        attendees: JSON.stringify(event.attendees),
        location: event.location,
        sourceBlob: JSON.stringify(event),
        summaryMd: summaryOutput.summaryMd,
        actionItems: JSON.stringify(summaryOutput.actionItems),
        confidence: summaryOutput.confidence,
        finalized: false,
      },
      update: {
        summaryMd: summaryOutput.summaryMd,
        actionItems: JSON.stringify(summaryOutput.actionItems),
        confidence: summaryOutput.confidence,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      summaryMd: summaryOutput.summaryMd,
      actionItems: summaryOutput.actionItems,
      confidence: summaryOutput.confidence,
    })
  } catch (error) {
    console.error('Summarize API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to generate summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
