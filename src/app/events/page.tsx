'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { FiCalendar, FiMapPin, FiUsers, FiGrid, FiList } from 'react-icons/fi'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ROSATOM_CITIES, HELP_TYPES } from '@/lib/utils'

interface Event {
  id: string
  title: string
  startDate: string
  city: string
  helpType: string[]
  volunteersNeeded: number
  ngo: {
    id: string
    brandName: string
  }
  _count: {
    participations: number
  }
}

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedHelpType, setSelectedHelpType] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['events', selectedCity, selectedHelpType],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCity) params.append('city', selectedCity)
      if (selectedHelpType) params.append('helpType', selectedHelpType)
      params.append('startDate', new Date().toISOString())

      const res = await fetch(`/api/events?${params}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    },
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDay = (day: Date) => {
    return events?.filter((event) =>
      isSameDay(new Date(event.startDate), day)
    ) || []
  }

  // Filter events by selected date if any
  const filteredEvents = events?.filter((event) => {
    if (selectedDate) {
      return isSameDay(new Date(event.startDate), selectedDate)
    }
    return true
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="container-custom py-8">
            <h1 className="text-3xl font-bold mb-4">Календарь мероприятий</h1>
            <p className="text-gray-600">
              Найдите возможность помочь и станьте волонтером
            </p>
          </div>
        </div>

        <div className="container-custom py-8">
          {/* Selected Date Filter Badge */}
          {selectedDate && (
            <div className="mb-4 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                События на {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
              </span>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-primary-600 hover:text-primary-700 text-sm underline"
              >
                Показать все
              </button>
            </div>
          )}

          {/* Filters and View Toggle */}
          <div className="card mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1">
                <label className="label">Город</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="input-field"
                >
                  <option value="">Все города</option>
                  {ROSATOM_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="label">Тип помощи</label>
                <select
                  value={selectedHelpType}
                  onChange={(e) => setSelectedHelpType(e.target.value)}
                  className="input-field"
                >
                  <option value="">Все типы</option>
                  {HELP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Список"
                >
                  <FiList size={20} />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Календарь"
                >
                  <FiGrid size={20} />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : viewMode === 'list' ? (
            /* List View */
            <div className="space-y-4">
              {filteredEvents && filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block"
                  >
                    <div className="card flex flex-col md:flex-row gap-6">
                      <div className="md:w-32 flex-shrink-0">
                        <div className="bg-primary-100 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-primary-600">
                            {format(new Date(event.startDate), 'd')}
                          </div>
                          <div className="text-sm text-primary-700">
                            {format(new Date(event.startDate), 'MMMM', { locale: ru })}
                          </div>
                        </div>
                      </div>

                      <div className="flex-grow">
                        <h3 className="text-xl font-bold mb-3">{event.title}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <FiCalendar />
                            <span>
                              {format(new Date(event.startDate), 'HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FiMapPin />
                            <span>{event.city}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FiUsers />
                            <span>
                              Нужно: {event.volunteersNeeded - event._count.participations}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {(typeof event.helpType === 'string'
                            ? JSON.parse(event.helpType)
                            : event.helpType
                          ).map((type: string) => (
                            <span
                              key={type}
                              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                            >
                              {type}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {event.ngo.brandName}
                          </span>
                          <span className="text-primary-600 font-medium">
                            Подробнее →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Мероприятий не найдено</p>
                  <p className="text-gray-400 mt-2">Попробуйте изменить фильтры</p>
                </div>
              )}
            </div>
          ) : (
            /* Calendar View */
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ← Назад
                </button>
                <h2 className="text-xl font-bold">
                  {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                </h2>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Вперед →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                  <div key={day} className="text-center font-bold text-gray-600 py-2">
                    {day}
                  </div>
                ))}

                {monthDays.map((day) => {
                  const dayEvents = getEventsForDay(day)
                  const hasEvents = dayEvents.length > 0
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-20 md:min-h-24 p-1 md:p-2 border rounded-lg relative ${
                        isSameMonth(day, currentMonth) ? 'bg-white' : 'bg-gray-50'
                      } ${hasEvents ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (hasEvents) {
                          // Switch to list view and filter by this date
                          setSelectedDate(day)
                          setViewMode('list')
                        }
                      }}
                    >
                      <div className="text-xs md:text-sm font-medium mb-1">
                        {format(day, 'd')}
                      </div>

                      {/* Desktop view - show compact event titles */}
                      <div className="hidden md:block space-y-0.5">
                        {dayEvents.slice(0, 2).map((event) => (
                          <Link
                            key={event.id}
                            href={`/events/${event.id}`}
                            className="block text-xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded hover:bg-primary-100 truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {event.title}
                          </Link>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 pl-1.5">
                            +{dayEvents.length - 2} ещё
                          </div>
                        )}
                      </div>

                      {/* Mobile view - show only count */}
                      {hasEvents && (
                        <div className="md:hidden">
                          <div className="absolute bottom-1 right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {dayEvents.length}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
