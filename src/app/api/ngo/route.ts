import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serializeNGO, deserializeNGO } from '@/lib/db-helpers'
import { z } from 'zod'

const ngoSchema = z.object({
  legalName: z.string().min(2, 'Юридическое название обязательно'),
  brandName: z.string().min(2, 'Название бренда обязательно'),
  inn: z.string().length(10, 'ИНН должен содержать 10 цифр'),
  description: z.string().min(50, 'Описание должно быть не менее 50 символов'),
  mission: z.string().optional(),
  city: z.string().min(2, 'Город обязателен'),
  address: z.string().min(5, 'Адрес обязателен'),
  phone: z.string().min(10, 'Телефон обязателен'),
  email: z.string().email('Неверный формат email'),
  website: z.string().url().optional().or(z.literal('')),
  categories: z.array(z.string()).min(1, 'Выберите хотя бы одну категорию'),
  organizationType: z.string().min(2, 'Тип организации обязателен'),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const categories = searchParams.get('categories')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '100')
    const status = searchParams.get('status') || 'APPROVED'

    const where: any = {
      status: status as any,
    }

    if (city) {
      where.city = city
    }

    if (categories && categories.length > 0) {
      where.categories = {
        hasSome: categories,
      }
    }

    const ngos = await prisma.nGO.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    })

    const deserializedNgos = ngos.map(ngo => deserializeNGO(ngo))
    return NextResponse.json(deserializedNgos)
  } catch (error) {
    console.error('Get NGOs error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка НКО' },
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

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден в базе данных' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = ngoSchema.parse(body)

    const existingNGO = await prisma.nGO.findUnique({
      where: { inn: validatedData.inn },
    })

    if (existingNGO) {
      return NextResponse.json(
        { error: 'НКО с таким ИНН уже зарегистрирована' },
        { status: 400 }
      )
    }

    const userNGO = await prisma.nGO.findUnique({
      where: { userId: session.user.id },
    })

    if (userNGO) {
      return NextResponse.json(
        { error: 'Вы уже зарегистрировали НКО' },
        { status: 400 }
      )
    }

    const ngo = await prisma.nGO.create({
      data: {
        ...serializeNGO(validatedData),
        userId: user.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json(deserializeNGO(ngo))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create NGO error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании НКО' },
      { status: 500 }
    )
  }
}
