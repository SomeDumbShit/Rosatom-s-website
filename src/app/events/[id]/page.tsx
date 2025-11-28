'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { FiCalendar, FiMapPin, FiUsers, FiClock } from 'react-icons/fi'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'react-hot-toast'

export default function EventPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const participateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${params.id}/participate`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Вы успешно записались на мероприятие!')
      queryClient.invalidateQueries({ queryKey: ['event', params.id] })
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleParticipate = () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    participateMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!event) return null

  const spotsLeft = event.volunteersNeeded - event.volunteersCount

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="card mb-6">
                <div className="mb-6">
                  <Link href="/events" className="text-primary-600 hover:text-primary-700 text-sm">
                    ← Вернуться к мероприятиям
                  </Link>
                </div>

                <h1 className="text-3xl font-bold mb-6">{event.title}</h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                  <div className="text-center p-3 md:p-4 bg-primary-50 border border-primary-100 rounded-lg">
                    <FiCalendar className="mx-auto mb-2 text-primary-600" size={20} />
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Дата</p>
                    <p className="font-medium text-sm md:text-base">{format(new Date(event.startDate), 'd MMM', { locale: ru })}</p>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-primary-50 border border-primary-100 rounded-lg">
                    <FiClock className="mx-auto mb-2 text-primary-600" size={20} />
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Время</p>
                    <p className="font-medium text-sm md:text-base">{format(new Date(event.startDate), 'HH:mm')}</p>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-primary-50 border border-primary-100 rounded-lg">
                    <FiMapPin className="mx-auto mb-2 text-primary-600" size={20} />
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Город</p>
                    <p className="font-medium text-sm md:text-base">{event.city}</p>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-primary-50 border border-primary-100 rounded-lg">
                    <FiUsers className="mx-auto mb-2 text-primary-600" size={20} />
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Нужно</p>
                    <p className="font-medium text-sm md:text-base">{spotsLeft} чел.</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">Описание</h2>
                  <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">Адрес</h2>
                  <p className="text-gray-700 mb-4">{event.address}</p>
                  <div className="w-full h-64 bg-gray-200 rounded-lg">
                    {/* Yandex Map */}
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      Карта с меткой адреса
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(typeof event.helpType === 'string'
                    ? JSON.parse(event.helpType)
                    : event.helpType
                  ).map((type: string) => (
                    <span
                      key={type}
                      className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h3 className="font-bold text-lg mb-4">Организатор</h3>
                <Link href={`/ngo/${event.ngo.id}`} className="block mb-6 hover:text-primary-600">
                  <p className="font-medium text-lg">{event.ngo.brandName}</p>
                </Link>

                <div className="bg-primary-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700 mb-2">Прогресс набора:</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-primary-600">{event.volunteersCount}</span>
                    <span className="text-gray-600">/ {event.volunteersNeeded}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(event.volunteersCount / event.volunteersNeeded) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {spotsLeft > 0 ? (
                  <button
                    onClick={handleParticipate}
                    disabled={participateMutation.isPending}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {participateMutation.isPending ? 'Записываем...' : 'Я помогу!'}
                  </button>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-600 text-center py-3 rounded-lg font-medium">
                    Набор завершен
                  </div>
                )}

                {!session && (
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Требуется{' '}
                    <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700">
                      вход в систему
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
