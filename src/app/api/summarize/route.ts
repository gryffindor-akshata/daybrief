import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateSummary } from '@/lib/llm'
import { buildSummaryPrompt } from '@/lib/prompt'
import { PrismaClient } from '@prisma/client'
import { NormalizedEvent } from '@/lib/calendar/types'
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
  }),
  regenerate: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
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
