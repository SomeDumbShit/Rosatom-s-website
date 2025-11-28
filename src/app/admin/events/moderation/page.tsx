'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { FiCheck, FiX, FiCalendar, FiMapPin } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function EventModerationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      router.push('/')
    }
  }, [status, session, router])

  const { data: events, isLoading } = useQuery({
    queryKey: ['pending-events'],
    queryFn: async () => {
      const res = await fetch('/api/admin/events/pending')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: session?.user.role === 'ADMIN' || session?.user.role === 'MODERATOR',
  })

  const moderateMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) => {
      const res = await fetch(`/api/admin/events/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: (_, variables) => {
      toast.success(variables.action === 'approve' ? 'Мероприятие опубликовано' : 'Мероприятие отклонено')
      queryClient.invalidateQueries({ queryKey: ['pending-events'] })
    },
    onError: () => {
      toast.error('Ошибка при обработке мероприятия')
    },
  })

  if (status === 'loading' || !session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="container-custom py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Модерация мероприятий</h1>
            <Link href="/admin" className="text-primary-600 hover:text-primary-700">
              ← К панели администратора
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event: any) => (
                <div key={event.id} className="card">
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <FiCalendar />
                          <span>{format(new Date(event.startDate), 'd MMMM yyyy, HH:mm', { locale: ru })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiMapPin />
                          <span>{event.city}</span>
                        </div>
                        <span>Волонтеров нужно: {event.volunteersNeeded}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{event.description}</p>
                      <p className="text-sm text-gray-600">
                        <strong>Адрес:</strong> {event.address}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Организатор:</strong>{' '}
                        <Link href={`/ngo/${event.ngo.id}`} className="text-primary-600 hover:text-primary-700">
                          {event.ngo.brandName}
                        </Link>
                      </p>
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
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => moderateMutation.mutate({ id: event.id, action: 'approve' })}
                        className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        disabled={moderateMutation.isPending}
                      >
                        <FiCheck />
                        <span>Опубликовать</span>
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Причина отклонения (необязательно):')
                          if (reason !== null) {
                            moderateMutation.mutate({ id: event.id, action: 'reject', reason: reason || undefined })
                          }
                        }}
                        className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        disabled={moderateMutation.isPending}
                      >
                        <FiX />
                        <span>Отклонить</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">Нет мероприятий на модерации</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
