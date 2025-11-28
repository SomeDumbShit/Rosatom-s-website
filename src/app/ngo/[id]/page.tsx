'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import NGOMiniMap from '@/components/ngo/NGOMiniMap'
import Link from 'next/link'
import Image from 'next/image'
import { FiMapPin, FiPhone, FiMail, FiGlobe, FiCheckCircle } from 'react-icons/fi'
import { FaVk, FaTelegram } from 'react-icons/fa'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface NGOData {
  id: string
  brandName: string
  legalName: string
  logo: string | null
  coverImage: string | null
  description: string
  mission: string | null
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  phone: string
  email: string
  website: string | null
  vkLink: string | null
  telegramLink: string | null
  categories: string[]
  organizationType: string
  status: string
  events: Array<{
    id: string
    title: string
    startDate: string
    city: string
    volunteersNeeded: number
  }>
  projects: Array<{
    id: string
    title: string
    description: string
    images: string[]
  }>
}

export default function NGOProfilePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'events' | 'projects' | 'contacts'>('events')

  const { data: ngo, isLoading } = useQuery<NGOData>({
    queryKey: ['ngo', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/ngo/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch NGO')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50">
          <div className="container-custom py-12">
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>
              <div className="h-12 bg-gray-200 rounded mb-4 w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!ngo) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">НКО не найдено</h1>
            <Link href="/ngo" className="text-primary-600 hover:text-primary-700">
              Вернуться к каталогу →
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        {/* Cover Image */}
        {ngo.coverImage && (
          <div className="w-full h-64 relative bg-gray-200">
            <Image
              src={ngo.coverImage}
              alt={ngo.brandName}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white shadow-sm">
          <div className="container-custom py-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 relative bg-gray-100 rounded-xl overflow-hidden">
                  {ngo.logo ? (
                    <Image
                      src={ngo.logo}
                      alt={ngo.brandName}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl font-bold">
                      {ngo.brandName[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-grow">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-2">
                  <h1 className="text-3xl font-bold break-words">{ngo.brandName}</h1>
                  {ngo.status === 'APPROVED' && (
                    <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg flex-shrink-0">
                      <FiCheckCircle />
                      <span className="font-medium whitespace-nowrap">Проверено</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 mb-4 break-words">{ngo.legalName}</p>
                <div className="flex items-center text-gray-600 mb-4">
                  <FiMapPin className="mr-2" />
                  <span>{ngo.city}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ngo.categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/ngo?categories=${encodeURIComponent(cat)}`}
                      className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-primary-200 transition-colors cursor-pointer"
                      title={`Найти другие НКО с категорией "${cat}"`}
                    >
                      {cat}
                    </Link>
                  ))}
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {ngo.organizationType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">О нас</h2>
                <div className="text-gray-700 prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: ngo.description }} />
                {ngo.mission && (
                  <>
                    <h3 className="text-xl font-bold mb-3">Наша миссия</h3>
                    <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: ngo.mission }} />
                  </>
                )}
              </div>

              {/* Tabs */}
              <div className="card">
                <div className="flex space-x-4 border-b mb-6">
                  <button
                    onClick={() => setActiveTab('events')}
                    className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                      activeTab === 'events'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Актуальные мероприятия ({ngo.events.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                      activeTab === 'projects'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Проекты ({ngo.projects.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('contacts')}
                    className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                      activeTab === 'contacts'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Контакты
                  </button>
                </div>

                {/* Events Tab */}
                {activeTab === 'events' && (
                  <div className="space-y-4">
                    {ngo.events.length > 0 ? (
                      ngo.events.map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="block p-4 border rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{event.title}</h3>
                            <span className="text-sm text-gray-500">
                              {format(new Date(event.startDate), 'd MMMM', { locale: ru })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {event.city} • Нужно: {event.volunteersNeeded} волонтеров
                          </p>
                          <span className="text-primary-600 font-medium text-sm">
                            Я помогу! →
                          </span>
                        </Link>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Нет активных мероприятий
                      </p>
                    )}
                  </div>
                )}

                {/* Projects Tab */}
                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    {ngo.projects.length > 0 ? (
                      ngo.projects.map((project) => (
                        <div key={project.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                          <h3 className="font-bold text-xl mb-3">{project.title}</h3>
                          <div className="text-gray-700 mb-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: project.description }} />
                          {project.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {project.images.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden"
                                >
                                  <Image
                                    src={img}
                                    alt={`${project.title} ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Нет добавленных проектов
                      </p>
                    )}
                  </div>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                  <div className="space-y-4 w-full">
                    <div className="flex items-start gap-2 w-full">
                      <FiMapPin className="mt-1 text-gray-400 flex-shrink-0" size={18} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">Адрес</p>
                        <p className="text-gray-600 text-sm break-words">{ngo.address}, {ngo.city}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 w-full">
                      <FiPhone className="mt-1 text-gray-400 flex-shrink-0" size={18} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">Телефон</p>
                        <a href={`tel:${ngo.phone}`} className="text-primary-600 hover:text-primary-700 text-sm break-words block">
                          {ngo.phone}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 w-full">
                      <FiMail className="mt-1 text-gray-400 flex-shrink-0" size={18} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">Email</p>
                        <a href={`mailto:${ngo.email}`} className="text-primary-600 hover:text-primary-700 text-sm break-words block">
                          {ngo.email}
                        </a>
                      </div>
                    </div>
                    {ngo.website && (
                      <div className="flex items-start gap-2 w-full">
                        <FiGlobe className="mt-1 text-gray-400 flex-shrink-0" size={18} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">Веб-сайт</p>
                          <a
                            href={ngo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-sm break-words block"
                          >
                            {ngo.website}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="pt-4 border-t">
                      <p className="font-medium mb-3">Социальные сети</p>
                      <div className="flex flex-wrap gap-4">
                        {ngo.vkLink && (
                          <a
                            href={ngo.vkLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-primary-600 transition-colors"
                            aria-label="VK"
                          >
                            <FaVk size={28} />
                          </a>
                        )}
                        {ngo.telegramLink && (
                          <a
                            href={ngo.telegramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-primary-600 transition-colors"
                            aria-label="Telegram"
                          >
                            <FaTelegram size={28} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Map */}
              {ngo.latitude && ngo.longitude && (
                <div className="card mb-6">
                  <h3 className="font-bold mb-4">Наше местоположение</h3>
                  <NGOMiniMap
                    latitude={ngo.latitude}
                    longitude={ngo.longitude}
                    ngoName={ngo.brandName}
                    address={ngo.address}
                  />
                </div>
              )}

              {/* Quick Actions */}
              <div className="card">
                <h3 className="font-bold mb-4">Как помочь?</h3>
                <div className="space-y-3">
                  <a
                    href={`mailto:${ngo.email}`}
                    className="block w-full text-center btn-secondary"
                  >
                    Написать письмо
                  </a>
                  <a
                    href={`tel:${ngo.phone}`}
                    className="block w-full text-center btn-secondary"
                  >
                    Позвонить
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
