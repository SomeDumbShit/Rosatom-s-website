'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'
import { ROSATOM_CITIES, HELP_TYPES } from '@/lib/utils'
import { format } from 'date-fns'
import RichTextEditor from '@/components/editor/RichTextEditor'

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()

  // Only fetch NGO data if user is NGO role
  const { data: ngo } = useQuery({
    queryKey: ['my-ngo'],
    queryFn: async () => {
      const res = await fetch('/api/ngo/my')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: session?.user?.role === 'NGO',
  })

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-edit', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${params.id}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    address: '',
    city: '',
    volunteersNeeded: 1,
    helpType: [] as string[],
  })

  useEffect(() => {
    if (event) {
      // Parse helpType from JSON string if needed
      const helpType = typeof event.helpType === 'string'
        ? JSON.parse(event.helpType)
        : event.helpType

      setFormData({
        title: event.title || '',
        description: event.description || '',
        startDate: event.startDate ? format(new Date(event.startDate), "yyyy-MM-dd'T'HH:mm") : '',
        endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm") : '',
        address: event.address || '',
        city: event.city || '',
        volunteersNeeded: event.volunteersNeeded || 1,
        helpType: helpType || [],
      })
    }
  }, [event])

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/events/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Мероприятие обновлено!')
      // Redirect based on user role
      if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR') {
        router.push('/admin/events')
      } else {
        router.push('/dashboard/events')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${params.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Мероприятие удалено')
      // Redirect based on user role
      if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR') {
        router.push('/admin/events')
      } else {
        router.push('/dashboard/events')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.helpType.length === 0) {
      toast.error('Выберите хотя бы один тип помощи')
      return
    }

    updateMutation.mutate(formData)
  }

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить это мероприятие? Это действие нельзя отменить.')) {
      deleteMutation.mutate()
    }
  }

  const handleHelpTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      helpType: prev.helpType.includes(type)
        ? prev.helpType.filter(t => t !== type)
        : [...prev.helpType, type]
    }))
  }

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // For NGO users, wait for NGO data to load
  if (session?.user?.role === 'NGO' && !ngo) {
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
          <div className="card max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">Мероприятие не найдено</h2>
            <button
              onClick={() => {
                const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR'
                router.push(isAdmin ? '/admin/events' : '/dashboard/events')
              }}
              className="btn-primary"
            >
              Вернуться к мероприятиям
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container-custom max-w-3xl">
          <div className="mb-8">
            <button
              onClick={() => {
                const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR'
                router.push(isAdmin ? '/admin/events' : '/dashboard/events')
              }}
              className="text-primary-600 hover:text-primary-700 mb-4"
            >
              ← Вернуться к мероприятиям
            </button>
            <h1 className="text-3xl font-bold mb-2">Редактировать мероприятие</h1>
            <p className="text-gray-600">Внесите изменения в волонтерское задание</p>
            {event.status === 'DRAFT' && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <p className="text-sm">
                  Это мероприятие ожидает модерации администратором. После одобрения оно станет видимым для волонтеров.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Основная информация</h2>

              <div className="space-y-6">
                <div>
                  <label className="label">Название мероприятия *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    required
                    placeholder="Например: Помощь в организации благотворительной ярмарки"
                  />
                </div>

                <div>
                  <label className="label">Описание *</label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Подробно опишите, чем будут заниматься волонтеры..."
                    minHeight="200px"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Дата и время начала *</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Дата и время окончания</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Требуется волонтеров *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.volunteersNeeded}
                    onChange={(e) => setFormData({ ...formData, volunteersNeeded: parseInt(e.target.value) })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-6">Место проведения</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Город *</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Выберите город</option>
                    {ROSATOM_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Адрес *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field"
                    required
                    placeholder="Улица, дом"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-6">Тип помощи *</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HELP_TYPES.map(type => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.helpType.includes(type)}
                      onChange={() => handleHelpTypeToggle(type)}
                      className="rounded"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR'
                  router.push(isAdmin ? '/admin/events' : '/dashboard/events')
                }}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="ml-auto bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Удаление...' : 'Удалить мероприятие'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
