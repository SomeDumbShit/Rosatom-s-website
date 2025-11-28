'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiMessageSquare, FiPlusCircle, FiX, FiCheck, FiClock } from 'react-icons/fi'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function SupportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  })

  // Fetch user's tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const res = await fetch('/api/support/tickets')
      if (!res.ok) throw new Error('Failed to fetch tickets')
      return res.json()
    },
    enabled: status === 'authenticated',
  })

  // Create ticket mutation
  const createMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string }) => {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Ошибка при создании обращения')
      }
      return res.json()
    },
    onSuccess: (ticket) => {
      toast.success('Обращение создано')
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      setShowCreateForm(false)
      setFormData({ subject: '', message: '' })
      router.push(`/dashboard/support/${ticket.id}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка при создании обращения')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="container-custom py-8">
          <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Поддержка</h1>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlusCircle /> Новое обращение
            </button>
          )}
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="card mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Новое обращение</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Тема обращения</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Кратко опишите проблему"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  minLength={5}
                />
              </div>
              <div>
                <label className="label">Сообщение</label>
                <textarea
                  className="input-field"
                  rows={5}
                  placeholder="Подробно опишите вашу проблему или вопрос"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  minLength={10}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Отправка...' : 'Отправить'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Загрузка обращений...</div>
          ) : tickets && tickets.length > 0 ? (
            tickets.map((ticket: any) => (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="card hover:shadow-lg transition-shadow block"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <FiMessageSquare className="text-primary-600 flex-shrink-0" size={20} />
                      <h3 className="font-semibold text-lg truncate">{ticket.subject}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {ticket.messages[0]?.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Создано: {format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                      </span>
                      <span>{ticket.messages.length} сообщений</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {ticket.status === 'OPEN' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <FiClock size={14} /> Открыто
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        <FiCheck size={14} /> Закрыто
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="card text-center py-12">
              <FiMessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 mb-4">У вас пока нет обращений в поддержку</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FiPlusCircle /> Создать первое обращение
              </button>
            </div>
          )}
        </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
