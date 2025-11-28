import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')

    const events = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
        ...(city && { city }),
      },
      orderBy: [
        {
          startDate: 'asc',
        },
      ],
      take: 5,
      include: {
        ngo: {
          select: {
            id: true,
            brandName: true,
          },
        },
        _count: {
          select: {
            participations: {
              where: {
                status: 'APPROVED',
              },
            },
          },
        },
      },
    })

    // Filter events that still need volunteers
    const urgentEvents = events.filter(
      (event) => event._count.participations < event.volunteersNeeded
    ).map((event) => ({
      ...event,
      volunteersCount: event._count.participations,
    }))

    return NextResponse.json(urgentEvents)
  } catch (error) {
    console.error('Get urgent events error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении срочных мероприятий' },
      { status: 500 }
    )
  }
}
