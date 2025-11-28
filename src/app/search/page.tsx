'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { FiSearch } from 'react-icons/fi'

// Helper function to strip HTML tags from text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return { ngos: [], events: [], articles: [] }
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: searchQuery.length > 0,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(query)
  }

  const totalResults = (results?.ngos?.length || 0) + (results?.events?.length || 0) + (results?.articles?.length || 0)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="container-custom py-12">
          <h1 className="text-3xl font-bold mb-8">Поиск</h1>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-2xl">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Введите запрос..."
                className="w-full px-6 py-4 pr-12 rounded-lg border-2 border-gray-300 focus:border-primary-500 focus:outline-none text-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FiSearch size={20} />
              </button>
            </div>
          </form>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : searchQuery ? (
            <div>
              <p className="text-gray-600 mb-8">
                Найдено результатов: <span className="font-bold">{totalResults}</span>
              </p>

              {results?.ngos && results.ngos.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4">НКО ({results.ngos.length})</h2>
                  <div className="space-y-4">
                    {results.ngos.map((ngo: any) => (
                      <Link key={ngo.id} href={`/ngo/${ngo.id}`} className="card">
                        <h3 className="font-bold text-lg mb-2">{ngo.brandName}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{stripHtml(ngo.description)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results?.events && results.events.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4">Мероприятия ({results.events.length})</h2>
                  <div className="space-y-4">
                    {results.events.map((event: any) => (
                      <Link key={event.id} href={`/events/${event.id}`} className="card">
                        <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                        <p className="text-gray-600 text-sm">{event.city} • {event.ngo.brandName}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results?.articles && results.articles.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4">Статьи ({results.articles.length})</h2>
                  <div className="space-y-4">
                    {results.articles.map((article: any) => (
                      <Link key={article.id} href={`/resources/${article.slug}`} className="card">
                        <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{article.excerpt}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {totalResults === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Ничего не найдено</p>
                  <p className="text-gray-400 mt-2">Попробуйте изменить запрос</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Введите запрос для поиска</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <div className="text-center">Загрузка...</div>
        </main>
        <Footer />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
