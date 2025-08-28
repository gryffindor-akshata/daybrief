import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const settingsSchema = z.object({
  timezone: z.string().optional(),
  recapEmail: z.boolean().optional(),
  recapSlack: z.boolean().optional(),
  slackUserId: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
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
    const settings = settingsSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...settings,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        timezone: updatedUser.timezone,
        recapEmail: updatedUser.recapEmail,
        recapSlack: updatedUser.recapSlack,
      },
    })
  } catch (error) {
    console.error('User settings API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid settings data',
        details: error.issues 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to update settings' 
    }, { status: 500 })
  }
}
