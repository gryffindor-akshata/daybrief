import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
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

    // Delete all user data in transaction
    await prisma.$transaction([
      // Delete all summaries
      prisma.summary.deleteMany({
        where: { userId: user.id },
      }),
      // Delete all accounts
      prisma.account.deleteMany({
        where: { userId: user.id },
      }),
      // Delete all sessions
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
      // Delete the user
      prisma.user.delete({
        where: { id: user.id },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user data API error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete user data' 
    }, { status: 500 })
  }
}
