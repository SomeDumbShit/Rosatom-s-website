import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deserializeNGO, deserializeEvent, deserializeProject } from '@/lib/db-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ngo = await prisma.nGO.findUnique({
      where: { id: params.id },
      include: {
        events: {
          where: {
            status: 'PUBLISHED',
            startDate: {
              gte: new Date(),
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        },
        projects: {
          orderBy: {
            createdAt: 'desc',
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

    const deserializedNGO = {
      ...deserializeNGO(ngo),
      events: ngo.events.map(event => deserializeEvent(event)),
      projects: ngo.projects.map(project => deserializeProject(project)),
    }

    return NextResponse.json(deserializedNGO)
  } catch (error) {
    console.error('Get NGO error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении данных НКО' },
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
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    const ngo = await prisma.nGO.findUnique({
      where: { id: params.id },
    })

    if (!ngo) {
      return NextResponse.json(
        { error: 'НКО не найдено' },
        { status: 404 }
      )
    }

    // Allow ADMIN and MODERATOR to edit any NGO, regular users can only edit their own
    const isAdminOrModerator = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR'
    if (!isAdminOrModerator && ngo.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Clean the body - remove fields that shouldn't be updated
    const { id, userId, createdAt, updatedAt, _count, events, projects, ...updateData } = body

    // Serialize arrays if needed
    if (updateData.categories && Array.isArray(updateData.categories)) {
      updateData.categories = JSON.stringify(updateData.categories)
    }

    const updatedNGO = await prisma.nGO.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updatedNGO)
  } catch (error: any) {
    console.error('Update NGO error:', error)
    return NextResponse.json(
      { error: error.message || 'Ошибка при обновлении НКО' },
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

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    await prisma.nGO.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete NGO error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении НКО' },
      { status: 500 }
    )
  }
}
