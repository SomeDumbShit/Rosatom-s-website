'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FiCalendar, FiMapPin, FiClock, FiSettings } from 'react-icons/fi'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Participation {
  id: string
  status: string
  attended: boolean
  event: {
    id: string
    title: string
    startDate: string
    city: string
    ngo: {
      brandName: string
    }
  }
}

export default function VolunteerDashboard() {
  const { data: session } = useSession()

  const { data: participations, isLoading } = useQuery<Participation[]>({
    queryKey: ['my-participations'],
    queryFn: async () => {
      const res = await fetch('/api/participations')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const upcoming = participations?.filter(
    (p) => new Date(p.event.startDate) > new Date()
  )
  const past = participations?.filter(
    (p) => new Date(p.event.startDate) <= new Date()
  )

  return (
    <div className="container-custom py-12">
      <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Привет, {session?.user?.name}! 👋
          </h1>
          <p className="text-gray-600">Добро пожаловать в ваш личный кабинет волонтера</p>
        </div>
        <Link
          href="/dashboard/settings"
          className="btn-secondary flex items-center gap-2"
        >
          <FiSettings />
          Настройки
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-gray-600 mb-2">Предстоящие</h3>
          <p className="text-3xl font-bold text-primary-600">{upcoming?.length || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 mb-2">Завершенные</h3>
          <p className="text-3xl font-bold text-green-600">{past?.length || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 mb-2">Всего участий</h3>
          <p className="text-3xl font-bold">{participations?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Предстоящие мероприятия</h2>
            <Link href="/events" className="text-primary-600 hover:text-primary-700">
              Найти еще →
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
              ))}
            </div>
          ) : upcoming && upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((p) => (
                <Link
                  key={p.id}
                  href={`/events/${p.event.id}`}
                  className="block"
                >
                  <div className="card">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg">{p.event.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          p.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {p.status === 'APPROVED' ? 'Одобрено' : 'На рассмотрении'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <FiCalendar />
                        <span>
                          {format(new Date(p.event.startDate), 'd MMMM yyyy, HH:mm', {
                            locale: ru,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiMapPin />
                        <span>{p.event.city}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                      {p.event.ngo.brandName}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">У вас пока нет предстоящих мероприятий</p>
              <Link href="/events" className="btn-primary inline-block">
                Найти мероприятие
              </Link>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">История участия</h2>

          {past && past.length > 0 ? (
            <div className="space-y-4">
              {past.map((p) => (
                <div key={p.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{p.event.title}</h3>
                    {p.attended && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        ✓ Участвовал
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {format(new Date(p.event.startDate), 'd MMMM yyyy', { locale: ru })}
                  </p>
                  <p className="text-sm text-gray-500">{p.event.ngo.brandName}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">История участия пока пуста</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
