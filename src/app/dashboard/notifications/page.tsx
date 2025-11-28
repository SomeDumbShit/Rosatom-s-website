'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!session,
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      if (!res.ok) throw new Error('Failed to mark as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) return null

  const unreadCount = notifications?.filter((n) => !n.read).length || 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="container-custom py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Уведомления</h1>
              {unreadCount > 0 && (
                <p className="text-gray-600">
                  У вас {unreadCount} {unreadCount === 1 ? 'непрочитанное' : 'непрочитанных'} уведомление
                </p>
              )}
            </div>
            <FiBell className="text-4xl text-primary-600" />
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`card transition-all ${
                    !notification.read ? 'border-l-4 border-l-primary-600 bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                        <span className="text-xs text-gray-500">
                          {format(new Date(notification.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                        </span>
                      </div>
                      <p className={`${!notification.read ? 'font-medium' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Отметить как прочитанное"
                        >
                          <FiCheck className="text-green-600" size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(notification.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <FiTrash2 className="text-red-600" size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 card">
              <FiBell className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">У вас пока нет уведомлений</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
