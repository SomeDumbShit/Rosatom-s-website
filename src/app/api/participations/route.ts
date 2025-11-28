import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    const participations = await prisma.eventParticipation.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        event: {
          include: {
            ngo: {
              select: {
                id: true,
                brandName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(participations)
  } catch (error) {
    console.error('Get participations error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка участий' },
      { status: 500 }
    )
  }
}
