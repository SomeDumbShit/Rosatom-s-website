'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiSend, FiX, FiCheck, FiUser } from 'react-icons/fi'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function TicketDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState('')

  const ticketId = params.id as string

  // Fetch ticket details
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/support/tickets/${ticketId}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('Обращение не найдено')
        if (res.status === 403) throw new Error('Нет доступа')
        throw new Error('Ошибка загрузки')
      }
      return res.json()
    },
    enabled: !!ticketId && status === 'authenticated',
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Ошибка отправки')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      setMessage('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка отправки сообщения')
    },
  })

  // Close ticket mutation
  const closeTicketMutation = useMutation({
    mutationFn: async (status: 'OPEN' | 'CLOSED') => {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Ошибка обновления')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      toast.success('Статус обращения обновлен')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка обновления статуса')
    },
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    sendMessageMutation.mutate(message)
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Загрузка обращения...</div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-600 mb-4">Обращение не найдено</p>
          <Link href="/dashboard/support" className="btn-primary inline-block">
            Вернуться к списку
          </Link>
        </div>
      </div>
    )
  }

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR'
  const isClosed = ticket.status === 'CLOSED'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="container-custom py-8">
          <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/support"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <FiArrowLeft /> Назад к списку
          </Link>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{ticket.subject}</h1>
              <p className="text-sm text-gray-500">
                Создано: {format(new Date(ticket.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {ticket.status === 'OPEN' ? (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Открыто
                  </span>
                  <button
                    onClick={() => closeTicketMutation.mutate('CLOSED')}
                    className="btn-secondary text-sm"
                    disabled={closeTicketMutation.isPending}
                  >
                    <FiX /> Закрыть
                  </button>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    Закрыто
                  </span>
                  <button
                    onClick={() => closeTicketMutation.mutate('OPEN')}
                    className="btn-secondary text-sm"
                    disabled={closeTicketMutation.isPending}
                  >
                    <FiCheck /> Открыть заново
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="card mb-4">
          <div className="space-y-4 max-h-[600px] overflow-y-auto p-4">
            {ticket.messages.map((msg: any) => {
              const isOwnMessage = msg.userId === session.user.id
              const isAdminMessage = msg.isAdmin

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] md:max-w-[70%] ${
                      isOwnMessage
                        ? 'bg-primary-100 text-primary-900'
                        : isAdminMessage
                        ? 'bg-accent-100 text-accent-900'
                        : 'bg-gray-100 text-gray-900'
                    } rounded-lg p-4`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FiUser size={14} />
                      <span className="font-semibold text-sm">
                        {msg.user.name}
                        {msg.isAdmin && ' (Поддержка)'}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {format(new Date(msg.createdAt), 'dd MMM, HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        {!isClosed && (
          <form onSubmit={handleSubmit} className="card">
            <div className="flex gap-2">
              <textarea
                className="input-field flex-1"
                rows={3}
                placeholder="Введите сообщение..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sendMessageMutation.isPending}
              />
              <button
                type="submit"
                className="btn-primary h-fit self-end"
                disabled={sendMessageMutation.isPending || !message.trim()}
              >
                <FiSend />
              </button>
            </div>
          </form>
        )}

        {isClosed && (
          <div className="card bg-gray-50 text-center py-8">
            <p className="text-gray-600 mb-4">Это обращение закрыто</p>
            <button
              onClick={() => closeTicketMutation.mutate('OPEN')}
              className="btn-primary inline-flex items-center gap-2"
              disabled={closeTicketMutation.isPending}
            >
              <FiCheck /> Открыть заново
            </button>
          </div>
        )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
