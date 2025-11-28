import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, getParticipationApprovedEmail } from '@/lib/email'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status, attended } = body

    const participation = await prisma.eventParticipation.findUnique({
      where: { id: params.id },
      include: {
        event: {
          include: {
            ngo: true,
          },
        },
        user: true,
      },
    })

    if (!participation) {
      return NextResponse.json(
        { error: 'Участие не найдено' },
        { status: 404 }
      )
    }

    // Check permissions - only NGO owner can update
    if (session.user.role === 'NGO') {
      const ngo = await prisma.nGO.findUnique({
        where: { userId: session.user.id },
      })

      if (!ngo || ngo.id !== participation.event.ngoId) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    const updated = await prisma.eventParticipation.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(attended !== undefined && { attended }),
      },
    })

    if (status === 'APPROVED') {
      await sendEmail({
        to: participation.user.email,
        subject: 'Ваша заявка одобрена!',
        html: getParticipationApprovedEmail(participation.event.title),
      })

      await prisma.notification.create({
        data: {
          userId: participation.user.id,
          title: 'Заявка одобрена',
          message: `Ваша заявка на мероприятие "${participation.event.title}" одобрена!`,
          type: 'participation_approved',
          link: `/events/${participation.event.id}`,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update participation error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении' },
      { status: 500 }
    )
  }
}
