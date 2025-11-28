'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { FaPlay } from 'react-icons/fa'

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ published: 'true' })
      if (selectedCategory) params.append('category', selectedCategory)

      const res = await fetch(`/api/articles?${params}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const categories = ['ngo', 'volunteers']
  const categoryLabels: Record<string, string> = {
    'ngo': 'Для НКО',
    'volunteers': 'Для Волонтеров',
  }

  // Extract all unique tags from articles
  const allTags = useMemo(() => {
    if (!articles) return []
    const tagSet = new Set<string>()
    articles.forEach((article: any) => {
      if (article.tags) {
        try {
          const tags = typeof article.tags === 'string' ? JSON.parse(article.tags) : article.tags
          tags.forEach((tag: string) => {
            if (tag && tag.trim()) tagSet.add(tag)
          })
        } catch (e) {
          // Skip invalid tags
        }
      }
    })
    return Array.from(tagSet).sort()
  }, [articles])

  // Filter articles by selected tag (client-side)
  const filteredArticles = useMemo(() => {
    if (!articles) return articles

    let filtered = articles

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter((article: any) => {
        if (!article.tags) return false
        try {
          const tags = typeof article.tags === 'string' ? JSON.parse(article.tags) : article.tags
          return tags.includes(selectedTag)
        } catch (e) {
          return false
        }
      })
    }

    return filtered
  }, [articles, selectedTag])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="container-custom py-8">
            <h1 className="text-3xl font-bold mb-4">База знаний</h1>
            <p className="text-gray-600">
              Видеокурсы, материалы и полезные ресурсы для волонтеров и НКО
            </p>
          </div>
        </div>

        <div className="container-custom py-8">
          {/* Category filters */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Категории:</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-6 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === ''
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Все
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Теги:</h3>
              <div className="flex gap-2 flex-wrap">
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag('')}
                    className="px-4 py-1.5 text-sm rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    Сбросить фильтр
                  </button>
                )}
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                    className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                      selectedTag === tag
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-80"></div>
              ))}
            </div>
          ) : filteredArticles && filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article: any) => (
                <Link
                  key={article.id}
                  href={`/resources/${article.slug}`}
                  className="card p-0 overflow-hidden"
                >
                  <div className="aspect-video relative bg-gradient-to-br from-primary-600 to-primary-800">
                    {article.coverImage ? (
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    ) : article.videoUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white">
                        <FaPlay className="text-5xl mb-2 opacity-80" />
                        <span className="text-sm font-medium">Видеокурс</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white opacity-60">
                        Материал
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                        {categoryLabels[article.category] || article.category}
                      </span>
                      {article.videoUrl && (
                        <span className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                          <FaPlay className="text-xs" /> Видео
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
                    {article.speaker && (
                      <p className="text-sm text-gray-500 mb-2">Спикер: {article.speaker}</p>
                    )}
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{article.excerpt}</p>
                    )}
                    {/* Tags */}
                    {article.tags && (() => {
                      try {
                        const tags = typeof article.tags === 'string' ? JSON.parse(article.tags) : article.tags
                        if (tags && tags.length > 0) {
                          return (
                            <div className="flex gap-1.5 flex-wrap mt-3">
                              {tags.slice(0, 3).map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{tags.length - 3}</span>
                              )}
                            </div>
                          )
                        }
                      } catch (e) {
                        return null
                      }
                      return null
                    })()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">
                {selectedTag
                  ? `Нет статей с тегом "${selectedTag}"`
                  : selectedCategory
                    ? 'Нет статей в этой категории'
                    : 'Нет статей'}
              </p>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag('')}
                  className="mt-4 text-primary-600 hover:text-primary-700 underline"
                >
                  Сбросить фильтр по тегам
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
