import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

const articleSchema = z.object({
  title: z.string().min(5, 'Заголовок должен быть не менее 5 символов'),
  content: z.string().min(100, 'Содержание должно быть не менее 100 символов'),
  excerpt: z.string().optional(),
  category: z.string().min(2, 'Категория обязательна'),
  published: z.boolean().default(false),
  videoUrl: z.string().url('Неверный формат URL').optional().or(z.literal('')),
  pdfUrl: z.string().url('Неверный формат URL').optional().or(z.literal('')),
  coverImage: z.string().optional(),
  fileUrl: z.string().optional(),
  tags: z.string().optional(),
  speaker: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const published = searchParams.get('published') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}

    if (published) {
      where.published = true
    }

    if (category) {
      where.category = category
    }

    const articles = await prisma.article.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Get articles error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении статей' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = articleSchema.parse(body)

    const slug = slugify(validatedData.title)

    const cleanData: any = {
      title: validatedData.title,
      content: validatedData.content,
      category: validatedData.category,
      published: validatedData.published,
      slug,
    }

    if (validatedData.excerpt) cleanData.excerpt = validatedData.excerpt
    if (validatedData.videoUrl && validatedData.videoUrl !== '') cleanData.videoUrl = validatedData.videoUrl
    if (validatedData.pdfUrl && validatedData.pdfUrl !== '') cleanData.pdfUrl = validatedData.pdfUrl
    if (validatedData.coverImage) cleanData.coverImage = validatedData.coverImage
    if (validatedData.fileUrl) cleanData.fileUrl = validatedData.fileUrl
    if (validatedData.tags) cleanData.tags = validatedData.tags
    if (validatedData.speaker) cleanData.speaker = validatedData.speaker

    const article = await prisma.article.create({
      data: cleanData,
    })

    return NextResponse.json(article)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create article error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании статьи' },
      { status: 500 }
    )
  }
}
