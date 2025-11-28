import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({
        ngos: [],
        events: [],
        articles: [],
      })
    }

    const searchTerm = query.toLowerCase()

    const [ngos, events, articles] = await Promise.all([
      prisma.nGO.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { brandName: { contains: searchTerm, mode: 'insensitive' } },
            { legalName: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { city: { contains: searchTerm, mode: 'insensitive' } },
            { categories: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 20,
        select: {
          id: true,
          brandName: true,
          description: true,
          city: true,
          logo: true,
        },
      }),
      prisma.event.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { city: { contains: searchTerm, mode: 'insensitive' } },
            { address: { contains: searchTerm, mode: 'insensitive' } },
            { helpType: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 20,
        include: {
          ngo: {
            select: {
              brandName: true,
            },
          },
        },
      }),
      prisma.article.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { excerpt: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { contains: searchTerm, mode: 'insensitive' } },
            { category: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 20,
        select: {
          id: true,
          title: true,
          excerpt: true,
          slug: true,
          coverImage: true,
          category: true,
        },
      }),
    ])

    return NextResponse.json({
      ngos,
      events,
      articles,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Ошибка при поиске' },
      { status: 500 }
    )
  }
}
