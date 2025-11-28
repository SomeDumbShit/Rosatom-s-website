import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'NGO') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const ngo = await prisma.nGO.findUnique({
      where: { userId: session.user.id },
    })

    if (!ngo) {
      return NextResponse.json(
        { error: 'НКО не найдено' },
        { status: 404 }
      )
    }

    const events = await prisma.event.findMany({
      where: {
        ngoId: ngo.id,
      },
      include: {
        _count: {
          select: {
            participations: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Get my events error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении мероприятий' },
      { status: 500 }
    )
  }
}
