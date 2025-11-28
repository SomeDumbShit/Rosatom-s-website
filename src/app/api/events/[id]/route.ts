import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const eventUpdateSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(50).optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  volunteersNeeded: z.number().min(1).optional(),
  helpType: z.array(z.string()).min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED']).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        ngo: {
          select: {
            id: true,
            brandName: true,
            logo: true,
            userId: true,
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

    if (!event) {
      return NextResponse.json(
        { error: 'Мероприятие не найдено' },
        { status: 404 }
      )
    }

    // Block access to unpublished events unless user is event owner or admin
    const isOwner = session?.user?.id === event.ngo.userId
    const isAdmin = session?.user?.role === 'ADMIN'

    if (event.status !== 'PUBLISHED' && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Мероприятие не найдено' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...event,
      volunteersCount: event._count.participations,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении мероприятия' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const isAdminOrModerator = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR'

    // Check if user is NGO owner or admin
    if (!isAdminOrModerator && session.user.role !== 'NGO') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // If user is NGO, verify they own the event
    if (session.user.role === 'NGO') {
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
      })

      if (!event) {
        return NextResponse.json(
          { error: 'Мероприятие не найдено' },
          { status: 404 }
        )
      }
    } else {
      // Admin/Moderator - just check event exists
      const event = await prisma.event.findUnique({
        where: { id: params.id },
      })

      if (!event) {
        return NextResponse.json(
          { error: 'Мероприятие не найдено' },
          { status: 404 }
        )
      }
    }

    const body = await request.json()
    const validatedData = eventUpdateSchema.parse(body)

    const updateData: any = {}

    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.description) updateData.description = validatedData.description
    if (validatedData.startDate) updateData.startDate = validatedData.startDate
    if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate
    if (validatedData.address) updateData.address = validatedData.address
    if (validatedData.city) updateData.city = validatedData.city
    if (validatedData.volunteersNeeded) updateData.volunteersNeeded = validatedData.volunteersNeeded
    if (validatedData.helpType) updateData.helpType = JSON.stringify(validatedData.helpType)
    if (validatedData.status) updateData.status = validatedData.status

    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка при обновлении мероприятия' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const isAdminOrModerator = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR'

    // Check if user is NGO owner or admin
    if (!isAdminOrModerator && session.user.role !== 'NGO') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // If user is NGO, verify they own the event
    if (session.user.role === 'NGO') {
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
      })

      if (!event) {
        return NextResponse.json(
          { error: 'Мероприятие не найдено' },
          { status: 404 }
        )
      }
    } else {
      // Admin/Moderator - just check event exists
      const event = await prisma.event.findUnique({
        where: { id: params.id },
      })

      if (!event) {
        return NextResponse.json(
          { error: 'Мероприятие не найдено' },
          { status: 404 }
        )
      }
    }

    await prisma.event.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при удалении мероприятия' },
      { status: 500 }
    )
  }
}
