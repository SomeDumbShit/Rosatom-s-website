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
      include: {
        _count: {
          select: {
            events: true,
            projects: true,
          },
        },
      },
    })

    if (!ngo) {
      return NextResponse.json(
        { error: 'НКО не найдено' },
        { status: 404 }
      )
    }

    return NextResponse.json(ngo)
  } catch (error) {
    console.error('Get my NGO error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении данных НКО' },
      { status: 500 }
    )
  }
}
