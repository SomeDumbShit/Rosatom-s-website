'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { FiEdit, FiTrash2, FiSearch, FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function AdminEventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      router.push('/')
    }
  }, [status, session, router])

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const res = await fetch('/api/events')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: session?.user.role === 'ADMIN' || session?.user.role === 'MODERATOR',
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Мероприятие удалено')
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    },
    onError: () => {
      toast.error('Ошибка при удалении')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Статус обновлен')
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    },
    onError: () => {
      toast.error('Ошибка при обновлении')
    },
  })

  if (status === 'loading' || !session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Filter events by search query
  const filteredEvents = events?.filter((event: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      event.title.toLowerCase().includes(query) ||
      event.city.toLowerCase().includes(query) ||
      event.ngo?.brandName?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="container-custom py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Управление мероприятиями</h1>
            <div className="flex gap-4">
              <Link href="/admin/events/moderation" className="btn-secondary">
                Модерация
              </Link>
              <Link href="/admin" className="text-primary-600 hover:text-primary-700">
                ← К панели администратора
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="card mb-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, городу или НКО..."
                className="input-field pl-12 w-full"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Название</th>
                    <th className="text-left py-4 px-4">НКО</th>
                    <th className="text-left py-4 px-4">Город</th>
                    <th className="text-left py-4 px-4">Дата</th>
                    <th className="text-left py-4 px-4">Волонтеры</th>
                    <th className="text-left py-4 px-4">Статус</th>
                    <th className="text-left py-4 px-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents && filteredEvents.length > 0 ? filteredEvents.map((event: any) => (
                    <tr key={event.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <Link href={`/events/${event.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                          {event.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        {event.ngo ? (
                          <Link href={`/ngo/${event.ngo.id}`} className="text-gray-700 hover:text-primary-600">
                            {event.ngo.brandName}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-4 px-4 flex items-center gap-1">
                        <FiMapPin size={14} className="text-gray-400" />
                        {event.city}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <FiCalendar size={14} className="text-gray-400" />
                          {format(new Date(event.startDate), 'd MMM yyyy, HH:mm', { locale: ru })}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <FiUsers size={14} className="text-gray-400" />
                          {event._count?.participations || 0} / {event.volunteersNeeded}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            event.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : event.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : event.status === 'DRAFT'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {event.status === 'PUBLISHED'
                            ? 'Опубликовано'
                            : event.status === 'PENDING'
                            ? 'На модерации'
                            : event.status === 'DRAFT'
                            ? 'Черновик'
                            : 'Отклонено'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 flex-wrap">
                          <Link
                            href={`/dashboard/events/${event.id}/edit`}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            <FiEdit /> Редактировать
                          </Link>
                          {event.status !== 'PUBLISHED' && event.status !== 'REJECTED' && (
                            <button
                              onClick={() => toggleStatusMutation.mutate({ id: event.id, status: 'PUBLISHED' })}
                              className="text-green-600 hover:text-green-700 text-sm"
                            >
                              Опубликовать
                            </button>
                          )}
                          {event.status === 'PUBLISHED' && (
                            <button
                              onClick={() => toggleStatusMutation.mutate({ id: event.id, status: 'DRAFT' })}
                              className="text-orange-600 hover:text-orange-700 text-sm"
                            >
                              Снять
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Удалить это мероприятие?')) {
                                deleteMutation.mutate(event.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                          >
                            <FiTrash2 /> Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        {searchQuery ? 'Ничего не найдено по запросу' : 'Нет мероприятий'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
