'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { FiMessageSquare, FiUser, FiClock, FiCheck, FiFilter } from 'react-icons/fi'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function AdminSupportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')

  // Fetch all tickets (admin)
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => {
      const res = await fetch('/api/support/tickets')
      if (!res.ok) throw new Error('Failed to fetch tickets')
      return res.json()
    },
    enabled: status === 'authenticated',
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  })

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-gray-500">Загрузка...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="container-custom">
            <div className="text-center">
              <p className="text-red-600">Доступ запрещен</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const filteredTickets = tickets?.filter((ticket: any) => {
    if (filterStatus === 'ALL') return true
    return ticket.status === filterStatus
  })

  const openCount = tickets?.filter((t: any) => t.status === 'OPEN').length || 0
  const closedCount = tickets?.filter((t: any) => t.status === 'CLOSED').length || 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container-custom">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Обращения в поддержку</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего обращений</p>
                <p className="text-3xl font-bold text-gray-900">{tickets?.length || 0}</p>
              </div>
              <FiMessageSquare className="text-primary-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Открытых</p>
                <p className="text-3xl font-bold text-green-600">{openCount}</p>
              </div>
              <FiClock className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Закрытых</p>
                <p className="text-3xl font-bold text-gray-600">{closedCount}</p>
              </div>
              <FiCheck className="text-gray-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <FiFilter className="text-gray-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-4 py-2 rounded ${
                  filterStatus === 'ALL'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все ({tickets?.length || 0})
              </button>
              <button
                onClick={() => setFilterStatus('OPEN')}
                className={`px-4 py-2 rounded ${
                  filterStatus === 'OPEN'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Открытые ({openCount})
              </button>
              <button
                onClick={() => setFilterStatus('CLOSED')}
                className={`px-4 py-2 rounded ${
                  filterStatus === 'CLOSED'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Закрытые ({closedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Загрузка обращений...</div>
          ) : filteredTickets && filteredTickets.length > 0 ? (
            filteredTickets.map((ticket: any) => {
              const lastMessage = ticket.messages[ticket.messages.length - 1]
              const hasUnreadFromUser = lastMessage && !lastMessage.isAdmin

              return (
                <Link
                  key={ticket.id}
                  href={`/dashboard/support/${ticket.id}`}
                  className={`card block ${
                    hasUnreadFromUser && ticket.status === 'OPEN' ? 'border-l-4 border-l-primary-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <FiMessageSquare
                          className={hasUnreadFromUser ? 'text-primary-600' : 'text-gray-400'}
                          size={20}
                        />
                        <h3 className="font-semibold text-lg truncate">{ticket.subject}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                        <FiUser size={14} />
                        <span className="font-medium">{ticket.user.name}</span>
                        <span className="text-gray-400">•</span>
                        <span>{ticket.user.email}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {lastMessage?.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Создано: {format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </span>
                        <span>
                          Обновлено: {format(new Date(ticket.updatedAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </span>
                        <span>{ticket.messages.length} сообщений</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {ticket.status === 'OPEN' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium whitespace-nowrap">
                          <FiClock size={14} /> Открыто
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium whitespace-nowrap">
                          <FiCheck size={14} /> Закрыто
                        </span>
                      )}
                      {hasUnreadFromUser && ticket.status === 'OPEN' && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">
                          Требует ответа
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="card text-center py-12">
              <FiMessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">
                {filterStatus === 'ALL'
                  ? 'Пока нет обращений'
                  : filterStatus === 'OPEN'
                  ? 'Нет открытых обращений'
                  : 'Нет закрытых обращений'}
              </p>
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
