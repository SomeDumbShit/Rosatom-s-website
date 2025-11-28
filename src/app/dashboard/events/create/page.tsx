'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'
import { ROSATOM_CITIES, HELP_TYPES } from '@/lib/utils'
import RichTextEditor from '@/components/editor/RichTextEditor'

export default function CreateEventPage() {
  const router = useRouter()

  const { data: ngo } = useQuery({
    queryKey: ['my-ngo'],
    queryFn: async () => {
      const res = await fetch('/api/ngo/my')
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
    city: ngo?.city || '',
    volunteersNeeded: 1,
    helpType: [] as string[],
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/events', {
        method: 'POST',
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
      toast.success('Мероприятие создано!')
      router.push('/dashboard/events')
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

    createMutation.mutate(formData)
  }

  const handleHelpTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      helpType: prev.helpType.includes(type)
        ? prev.helpType.filter(t => t !== type)
        : [...prev.helpType, type]
    }))
  }

  if (!ngo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (ngo.status !== 'APPROVED') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="card max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">Недоступно</h2>
            <p className="text-gray-600 mb-4">
              Вы сможете создавать мероприятия после одобрения вашей организации администратором
            </p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary">
              Вернуться в дашборд
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
            <h1 className="text-3xl font-bold mb-2">Создать мероприятие</h1>
            <p className="text-gray-600">Опубликуйте волонтерское задание</p>
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
                disabled={createMutation.isPending}
                className="btn-primary disabled:opacity-50"
              >
                {createMutation.isPending ? 'Создание...' : 'Создать мероприятие'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/events')}
                className="btn-secondary"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
