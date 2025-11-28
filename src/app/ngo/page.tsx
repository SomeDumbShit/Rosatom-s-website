'use client'

import { useState, useEffect, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { FiMapPin, FiSearch } from 'react-icons/fi'
import { ROSATOM_CITIES, NGO_CATEGORIES, ORGANIZATION_TYPES, NGO_CATEGORIES_MAP, NGO_TAGS_TO_LABELS } from '@/lib/utils'

// Helper function to strip HTML tags from text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

interface NGO {
  id: string
  brandName: string
  logo: string | null
  city: string
  categories: string[]
  organizationType: string
  description: string
  status: string
  _count: {
    events: number
  }
}

function NGOCatalogContent() {
  const searchParams = useSearchParams()
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [onlyWithEvents, setOnlyWithEvents] = useState(false)

  // Применяем категории из URL при загрузке
  useEffect(() => {
    const categoriesParam = searchParams?.get('categories')
    if (categoriesParam) {
      const categories = categoriesParam.split(',').map(c => decodeURIComponent(c))
      setSelectedCategories(categories)
    }
  }, [searchParams])

  const { data: ngos, isLoading } = useQuery<NGO[]>({
    queryKey: ['ngos-catalog'],
    queryFn: async () => {
      const res = await fetch(`/api/ngo?status=APPROVED`)
      if (!res.ok) throw new Error('Failed to fetch NGOs')
      return res.json()
    },
  })

  const filteredNGOs = ngos
    ?.filter((ngo) => {
      // City filter
      if (selectedCities.length > 0) {
        return selectedCities.includes(ngo.city)
      }
      return true
    })
    ?.filter((ngo) => {
      // Category filter - check both Russian labels and English tags
      if (selectedCategories.length > 0) {
        return ngo.categories.some((cat) => {
          // Check if category matches directly (Russian label)
          if (selectedCategories.includes(cat)) return true

          // Check if category is an English tag and selected category is Russian label
          const russianLabel = NGO_TAGS_TO_LABELS[cat as keyof typeof NGO_TAGS_TO_LABELS]
          if (russianLabel && selectedCategories.includes(russianLabel)) return true

          // Check if category is Russian label and selected category is English tag
          const englishTag = NGO_CATEGORIES_MAP[cat as keyof typeof NGO_CATEGORIES_MAP]
          if (englishTag && selectedCategories.includes(englishTag)) return true

          return false
        })
      }
      return true
    })
    ?.filter((ngo) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          ngo.brandName.toLowerCase().includes(query) ||
          ngo.description.toLowerCase().includes(query)
        )
      }
      return true
    })
    ?.filter((ngo) => {
      // Organization type filter
      if (selectedTypes.length > 0) {
        return selectedTypes.includes(ngo.organizationType)
      }
      return true
    })
    ?.filter((ngo) => {
      // Only with active events filter
      if (onlyWithEvents) {
        return ngo._count.events > 0
      }
      return true
    })
    ?.sort((a, b) => {
      if (sortBy === 'name') {
        return a.brandName.localeCompare(b.brandName, 'ru')
      } else {
        return new Date(b.id).getTime() - new Date(a.id).getTime()
      }
    })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="container-custom py-8">
            <h1 className="text-3xl font-bold mb-4">Каталог НКО</h1>
            <p className="text-gray-600">
              Найдите организацию, которой вы хотите помочь
            </p>
          </div>
        </div>

        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
                <h2 className="font-bold text-lg mb-4">Фильтры</h2>

                {/* Search */}
                <div className="mb-6">
                  <label className="label">Поиск</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Название или описание..."
                    />
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* City Filter */}
                <div className="mb-6">
                  <label className="label">Города (можно выбрать несколько)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {ROSATOM_CITIES.map((city) => (
                      <label key={city} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedCities.includes(city)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCities([...selectedCities, city])
                            } else {
                              setSelectedCities(selectedCities.filter((c) => c !== city))
                            }
                          }}
                          className="rounded"
                        />
                        <span>{city}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Categories Filter */}
                <div className="mb-6">
                  <label className="label">Направления</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {NGO_CATEGORIES.map((category) => (
                      <label key={category} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, category])
                            } else {
                              setSelectedCategories(
                                selectedCategories.filter((c) => c !== category)
                              )
                            }
                          }}
                          className="rounded"
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Organization Type Filter */}
                <div className="mb-6">
                  <label className="label">Тип организации</label>
                  <div className="space-y-2">
                    {ORGANIZATION_TYPES.map((type) => (
                      <label key={type} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTypes([...selectedTypes, type])
                            } else {
                              setSelectedTypes(selectedTypes.filter((t) => t !== type))
                            }
                          }}
                          className="rounded"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Only with events toggle */}
                <div className="mb-6">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={onlyWithEvents}
                      onChange={(e) => setOnlyWithEvents(e.target.checked)}
                      className="rounded"
                    />
                    <span>Только те, кому нужна помощь</span>
                  </label>
                </div>

                {/* Sort */}
                <div className="mb-6">
                  <label className="label">Сортировка</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input-field"
                  >
                    <option value="name">По алфавиту</option>
                    <option value="date">По дате добавления</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSelectedCities([])
                    setSelectedCategories([])
                    setSelectedTypes([])
                    setSearchQuery('')
                    setOnlyWithEvents(false)
                  }}
                  className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>

            {/* NGO Grid */}
            <div className="lg:col-span-3">
              <div className="mb-6 flex justify-between items-center">
                <p className="text-gray-600">
                  Найдено: <span className="font-bold">{filteredNGOs?.length || 0}</span> организаций
                </p>
                <Link href="/map" className="text-primary-600 hover:text-primary-700 font-medium">
                  Смотреть на карте →
                </Link>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-80"></div>
                  ))}
                </div>
              ) : filteredNGOs && filteredNGOs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredNGOs.map((ngo) => (
                    <Link
                      key={ngo.id}
                      href={`/ngo/${ngo.id}`}
                      className="card"
                    >
                      <div className="aspect-square relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
                        {ngo.logo ? (
                          <Image
                            src={ngo.logo}
                            alt={ngo.brandName}
                            fill
                            className="object-contain p-4"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                            {ngo.brandName[0]}
                          </div>
                        )}
                      </div>

                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg line-clamp-1 flex-grow">
                          {ngo.brandName}
                        </h3>
                        {ngo.status === 'APPROVED' && (
                          <span className="text-green-600 text-xs ml-2" title="Проверено">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <FiMapPin className="mr-1 flex-shrink-0" />
                        <span className="line-clamp-1">{ngo.city}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {ngo.categories.slice(0, 2).map((cat) => (
                          <Link
                            key={cat}
                            href={`/ngo?categories=${encodeURIComponent(cat)}`}
                            className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded hover:bg-primary-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              setSelectedCategories([cat])
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            {cat}
                          </Link>
                        ))}
                        {ngo.categories.length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            +{ngo.categories.length - 2}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {stripHtml(ngo.description)}
                      </p>

                      {ngo._count.events > 0 && (
                        <div className="pt-3 border-t">
                          <span className="text-sm text-primary-600 font-medium">
                            {ngo._count.events} активных мероприятий
                          </span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Ничего не найдено</p>
                  <p className="text-gray-400 mt-2">Попробуйте изменить фильтры</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function NGOCatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50">
          <div className="bg-white shadow-sm">
            <div className="container-custom py-8">
              <h1 className="text-3xl font-bold mb-4">Каталог НКО</h1>
              <p className="text-gray-600">Загрузка...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <NGOCatalogContent />
    </Suspense>
  )
}
