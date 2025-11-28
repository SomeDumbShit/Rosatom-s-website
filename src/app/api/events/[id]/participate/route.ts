import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/events/[id]/participate - Register for an event
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a volunteer
    if (session.user.role !== 'VOLUNTEER') {
      return NextResponse.json(
        { error: 'Only volunteers can participate in events' },
        { status: 403 }
      )
    }

    // Get event
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
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

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if event is in the past
    if (event.startDate < new Date()) {
      return NextResponse.json(
        { error: 'Cannot register for past events' },
        { status: 400 }
      )
    }

    // Check if there are spots available
    const approvedCount = event._count.participations
    if (approvedCount >= event.volunteersNeeded) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Check if user already registered
    const existing = await prisma.eventParticipation.findFirst({
      where: {
        eventId: params.id,
        userId: session.user.id,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      )
    }

    const participation = await prisma.eventParticipation.create({
      data: {
        eventId: params.id,
        userId: session.user.id,
        status: 'APPROVED',
      },
    })

    return NextResponse.json(participation, { status: 201 })
  } catch (error) {
    console.error('Error registering for event:', error)
    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    )
  }
}
