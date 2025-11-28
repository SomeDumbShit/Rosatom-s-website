import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const eventSchema = z.object({
  title: z.string().min(5, 'Название должно быть не менее 5 символов'),
  description: z.string().min(50, 'Описание должно быть не менее 50 символов'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  address: z.string().min(5, 'Адрес обязателен'),
  city: z.string().min(2, 'Город обязателен'),
  volunteersNeeded: z.number().min(1, 'Требуется хотя бы 1 волонтер'),
  helpType: z.array(z.string()).min(1, 'Выберите тип помощи'),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const helpType = searchParams.get('helpType')
    const startDate = searchParams.get('startDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {
      status: 'PUBLISHED',
    }

    if (city) {
      where.city = city
    }

    if (helpType) {
      where.helpType = {
        hasSome: [helpType],
      }
    }

    if (startDate) {
      where.startDate = {
        gte: new Date(startDate),
      }
    }

    const events = await prisma.event.findMany({
      where,
      take: limit,
      orderBy: {
        startDate: 'asc',
      },
      include: {
        ngo: {
          select: {
            id: true,
            brandName: true,
            logo: true,
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

    return NextResponse.json(events)
  } catch (error) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка мероприятий' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    if (!ngo || ngo.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Ваше НКО должно быть одобрено для создания мероприятий' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = eventSchema.parse(body)

    const eventData: any = {
      title: validatedData.title,
      description: validatedData.description,
      startDate: validatedData.startDate,
      address: validatedData.address,
      city: validatedData.city,
      volunteersNeeded: validatedData.volunteersNeeded,
      helpType: JSON.stringify(validatedData.helpType),
      ngoId: ngo.id,
      status: 'DRAFT',
    }

    if (validatedData.endDate) {
      eventData.endDate = validatedData.endDate
    }

    const event = await prisma.event.create({
      data: eventData,
    })

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create event error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании мероприятия' },
      { status: 500 }
    )
  }
}
