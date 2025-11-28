'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Event {
  id: string
  title: string
  startDate: string
  city: string
  volunteersNeeded: number
  volunteersCount: number
  ngo: {
    brandName: string
  }
}

export default function UrgentHelp() {
  const [selectedCity, setSelectedCity] = useState<string>('')

  useEffect(() => {
    // Load selected city from localStorage
    const savedCity = localStorage.getItem('selectedCity')
    if (savedCity) {
      setSelectedCity(savedCity)
    }

    // Listen to city changes
    const handleCityChange = (event: CustomEvent) => {
      setSelectedCity(event.detail || '')
    }

    window.addEventListener('cityChanged' as any, handleCityChange)
    return () => window.removeEventListener('cityChanged' as any, handleCityChange)
  }, [])

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['urgent-events', selectedCity],
    queryFn: async () => {
      const url = selectedCity
        ? `/api/events/urgent?city=${encodeURIComponent(selectedCity)}`
        : '/api/events/urgent'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64"></div>
        ))}
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Нет срочных мероприятий</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {events.slice(0, 5).map((event) => (
        <Link
          key={event.id}
          href={`/events/${event.id}`}
          className="card transition-all border-l-4 border-red-500"
        >
          <div className="flex items-start justify-between mb-4">
            <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
              СРОЧНО
            </span>
          </div>

          <h3 className="text-xl font-bold mb-3 line-clamp-2">{event.title}</h3>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <FiCalendar />
              <span>{format(new Date(event.startDate), 'd MMMM yyyy', { locale: ru })}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiMapPin />
              <span>{event.city}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiUsers />
              <span>
                Нужно: {event.volunteersNeeded - event.volunteersCount} волонтеров
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">{event.ngo.brandName}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
