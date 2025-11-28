import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ngoId = searchParams.get('ngoId')

  try {
    const projects = await prisma.project.findMany({
      where: ngoId ? { ngoId } : undefined,
      include: {
        ngo: {
          select: {
            brandName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'NGO') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ngo = await prisma.nGO.findUnique({
      where: { userId: session.user.id },
    })

    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }

    const body = await request.json()
    const project = await prisma.project.create({
      data: {
        ...body,
        ngoId: ngo.id,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
