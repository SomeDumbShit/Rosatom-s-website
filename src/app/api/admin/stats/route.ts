import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const [totalNGOs, totalVolunteers, totalEvents, pendingNGOs, totalArticles] = await Promise.all([
      prisma.nGO.count(),
      prisma.user.count({ where: { role: 'VOLUNTEER' } }),
      prisma.event.count(),
      prisma.nGO.count({ where: { status: 'PENDING' } }),
      prisma.article.count(),
    ])

    return NextResponse.json({
      totalNGOs,
      totalVolunteers,
      totalEvents,
      pendingNGOs,
      totalArticles,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
