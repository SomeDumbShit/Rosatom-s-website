'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'
import { FiCheck, FiX, FiMail, FiPhone } from 'react-icons/fi'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function ManageEventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-manage', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${params.id}/manage`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const updateParticipationMutation = useMutation({
    mutationFn: async ({ participationId, status }: { participationId: string; status: string }) => {
      const res = await fetch(`/api/participations/${participationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-manage', params.id] })
      toast.success('Статус обновлен')
    },
    onError: () => {
      toast.error('Ошибка при обновлении статуса')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Мероприятие не найдено</p>
            <button onClick={() => router.push('/dashboard/events')} className="btn-primary">
              Вернуться к мероприятиям
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const pending = event.participations?.filter((p: any) => p.status === 'PENDING') || []
  const approved = event.participations?.filter((p: any) => p.status === 'APPROVED') || []
  const rejected = event.participations?.filter((p: any) => p.status === 'REJECTED') || []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container-custom max-w-5xl">
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard/events')}
              className="text-primary-600 hover:text-primary-700 mb-4"
            >
              ← Вернуться к мероприятиям
            </button>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <p className="text-gray-600">
              {format(new Date(event.startDate), 'd MMMM yyyy, HH:mm', { locale: ru })} • {event.city}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-gray-600 mb-2">На рассмотрении</h3>
              <p className="text-3xl font-bold text-yellow-600">{pending.length}</p>
            </div>
            <div className="card">
              <h3 className="text-gray-600 mb-2">Одобрено</h3>
              <p className="text-3xl font-bold text-green-600">{approved.length}</p>
            </div>
            <div className="card">
              <h3 className="text-gray-600 mb-2">Мест осталось</h3>
              <p className="text-3xl font-bold text-primary-600">
                {event.volunteersNeeded - approved.length}
              </p>
            </div>
          </div>

          {/* Pending */}
          {pending.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-4">На рассмотрении ({pending.length})</h2>
              <div className="space-y-4">
                {pending.map((participation: any) => (
                  <div key={participation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{participation.user.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <FiMail size={14} />
                          <span>{participation.user.email}</span>
                        </span>
                        {participation.user.city && (
                          <span>{participation.user.city}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateParticipationMutation.mutate({
                          participationId: participation.id,
                          status: 'APPROVED'
                        })}
                        className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        <FiCheck />
                        <span>Одобрить</span>
                      </button>
                      <button
                        onClick={() => updateParticipationMutation.mutate({
                          participationId: participation.id,
                          status: 'REJECTED'
                        })}
                        className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        <FiX />
                        <span>Отклонить</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved */}
          {approved.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-4">Одобренные волонтеры ({approved.length})</h2>
              <div className="space-y-3">
                {approved.map((participation: any) => (
                  <div key={participation.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">{participation.user.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <FiMail size={14} />
                          <span>{participation.user.email}</span>
                        </span>
                        {participation.user.city && (
                          <span>{participation.user.city}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {participation.attended && (
                        <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full">
                          ✓ Участвовал
                        </span>
                      )}
                      {!participation.attended && new Date(event.startDate) < new Date() && (
                        <button
                          onClick={() => updateParticipationMutation.mutate({
                            participationId: participation.id,
                            status: 'APPROVED'
                          })}
                          className="text-xs bg-primary-600 text-white px-3 py-1 rounded-full hover:bg-primary-700"
                        >
                          Отметить участие
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Отклоненные ({rejected.length})</h2>
              <div className="space-y-3">
                {rejected.map((participation: any) => (
                  <div key={participation.id} className="p-4 bg-red-50 rounded-lg">
                    <p className="font-medium text-gray-700">{participation.user.name}</p>
                    <p className="text-sm text-gray-600">{participation.user.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.participations?.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500">Пока нет заявок от волонтеров</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
