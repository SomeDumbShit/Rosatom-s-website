'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Article {
  id: string
  title: string
  excerpt: string
  coverImage: string | null
  category: string
  createdAt: string
  slug: string
}

interface Props {
  limit?: number
}

export default function EducationalResources({ limit = 4 }: Props) {
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ['articles-home', limit],
    queryFn: async () => {
      const res = await fetch(`/api/articles?limit=${limit}&published=true`)
      if (!res.ok) throw new Error('Failed to fetch articles')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-80"></div>
        ))}
      </div>
    )
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Нет доступных статей</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/resources/${article.slug}`}
            className="card p-0 overflow-hidden"
          >
            <div className="aspect-video relative bg-gray-100">
              {article.coverImage ? (
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-sm">Нет изображения</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                  {article.category}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(article.createdAt), 'd MMM', { locale: ru })}
                </span>
              </div>

              <h3 className="font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">{article.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link href="/resources" className="btn-primary">
          Все ресурсы
        </Link>
      </div>
    </>
  )
}
