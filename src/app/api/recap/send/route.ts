import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateDailyRecap } from '@/lib/recap'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    const { date } = await request.json()
    const targetDate = date || new Date().toISOString().split('T')[0]

    const result = await generateDailyRecap({
      userId: user.id,
      date: targetDate,
      timezone: user.timezone,
    })

    return NextResponse.json({
      success: true,
      sentTo: result.sentTo,
      preview: result.content.substring(0, 200) + '...',
    })
  } catch (error) {
    console.error('Recap send API error:', error)
    return NextResponse.json({ 
      error: 'Failed to send recap',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
