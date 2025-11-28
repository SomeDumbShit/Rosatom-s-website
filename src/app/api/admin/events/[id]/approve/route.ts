import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, reason } = approvalSchema.parse(body)

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        ngo: {
          select: {
            id: true,
            brandName: true,
            userId: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Мероприятие не найдено' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      const updatedEvent = await prisma.event.update({
        where: { id: params.id },
        data: {
          status: 'PUBLISHED',
        },
      })

      await prisma.notification.create({
        data: {
          userId: event.ngo.userId,
          type: 'EVENT_APPROVED',
          title: 'Мероприятие одобрено',
          message: `Ваше мероприятие "${event.title}" было одобрено и опубликовано`,
          link: `/events/${event.id}`,
        },
      })

      return NextResponse.json({
        success: true,
        event: updatedEvent,
      })
    } else {
      const updatedEvent = await prisma.event.update({
        where: { id: params.id },
        data: {
          status: 'CANCELLED',
        },
      })

      await prisma.notification.create({
        data: {
          userId: event.ngo.userId,
          type: 'EVENT_REJECTED',
          title: 'Мероприятие отклонено',
          message: `Ваше мероприятие "${event.title}" было отклонено${reason ? `: ${reason}` : ''}`,
          link: `/events/${event.id}`,
        },
      })

      return NextResponse.json({
        success: true,
        event: updatedEvent,
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Event approval error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обработке мероприятия' },
      { status: 500 }
    )
  }
}
