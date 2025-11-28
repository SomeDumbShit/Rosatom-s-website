'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { FiPlus, FiCalendar, FiMapPin, FiUsers, FiEdit, FiTrash2 } from 'react-icons/fi'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function NGOEventsPage() {
  const router = useRouter()

  const { data: ngo } = useQuery({
    queryKey: ['my-ngo'],
    queryFn: async () => {
      const res = await fetch('/api/ngo/my')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const { data: events, isLoading } = useQuery({
    queryKey: ['my-events'],
    queryFn: async () => {
      const res = await fetch('/api/events/my')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: !!ngo,
  })

  if (!ngo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Мои мероприятия</h1>
              <p className="text-gray-600">Управление волонтерскими заданиями</p>
            </div>
            <Link href="/dashboard/events/create" className="btn-primary flex items-center space-x-2">
              <FiPlus />
              <span>Создать мероприятие</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event: any) => (
                <div key={event.id} className="card">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-24 flex-shrink-0">
                      <div className="bg-primary-100 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary-600">
                          {format(new Date(event.startDate), 'd')}
                        </div>
                        <div className="text-sm text-primary-700">
                          {format(new Date(event.startDate), 'MMM', { locale: ru })}
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold">{event.title}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          event.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : event.status === 'DRAFT'
                            ? 'bg-yellow-100 text-yellow-700'
                            : event.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {event.status === 'PUBLISHED' ? 'Опубликовано' :
                           event.status === 'DRAFT' ? 'На модерации' :
                           event.status === 'CANCELLED' ? 'Отклонено' :
                           event.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <FiCalendar />
                          <span>{format(new Date(event.startDate), 'HH:mm')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FiMapPin />
                          <span>{event.city}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FiUsers />
                          <span>{event._count?.participations || 0} / {event.volunteersNeeded}</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Link
                          href={`/dashboard/events/${event.id}/edit`}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center space-x-1"
                        >
                          <FiEdit size={16} />
                          <span>Редактировать</span>
                        </Link>
                        <Link
                          href={`/dashboard/events/${event.id}`}
                          className="text-gray-600 hover:text-gray-700 font-medium text-sm flex items-center space-x-1"
                        >
                          <FiUsers size={16} />
                          <span>Волонтеры</span>
                        </Link>
                        <Link
                          href={`/events/${event.id}`}
                          className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                        >
                          Посмотреть →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <FiCalendar className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-bold mb-2">Нет созданных мероприятий</h3>
              <p className="text-gray-600 mb-6">Создайте первое мероприятие для привлечения волонтеров</p>
              <Link href="/dashboard/events/create" className="btn-primary inline-block">
                Создать мероприятие
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
