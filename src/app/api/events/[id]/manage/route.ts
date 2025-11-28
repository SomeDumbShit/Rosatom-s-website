import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const event = await prisma.event.findUnique({
      where: {
        id: params.id,
        ngoId: ngo.id,
      },
      include: {
        participations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                city: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
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

    return NextResponse.json(event)
  } catch (error) {
    console.error('Get event manage error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении данных' },
      { status: 500 }
    )
  }
}
