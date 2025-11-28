'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { FiUsers, FiMapPin, FiCalendar, FiAlertCircle, FiMessageSquare } from 'react-icons/fi'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      router.push('/')
    }
  }, [status, session, router])

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: session?.user.role === 'ADMIN' || session?.user.role === 'MODERATOR',
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
          <h1 className="text-3xl font-bold mb-8">
            {session.user.role === 'ADMIN' ? 'Панель администратора' : 'Панель модератора'}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Всего НКО</h3>
                <FiMapPin className="text-primary-600" size={24} />
              </div>
              <p className="text-3xl font-bold">{stats?.totalNGOs || 0}</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Волонтеров</h3>
                <FiUsers className="text-green-600" size={24} />
              </div>
              <p className="text-3xl font-bold">{stats?.totalVolunteers || 0}</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Мероприятий</h3>
                <FiCalendar className="text-blue-600" size={24} />
              </div>
              <p className="text-3xl font-bold">{stats?.totalEvents || 0}</p>
            </div>

            <div className="card bg-yellow-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">На модерации</h3>
                <FiAlertCircle className="text-yellow-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-yellow-600">{stats?.pendingNGOs || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/ngo/moderation" className="card">
              <div className="flex items-center justify-between mb-4">
                <FiAlertCircle className="text-yellow-600" size={32} />
                {stats?.pendingNGOs > 0 && (
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                    {stats.pendingNGOs}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">Модерация НКО</h3>
              <p className="text-gray-600 text-sm">Проверка и одобрение новых организаций</p>
            </Link>

            <Link href="/admin/events/moderation" className="card">
              <FiCalendar className="text-orange-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Модерация мероприятий</h3>
              <p className="text-gray-600 text-sm">Проверка и публикация событий</p>
            </Link>

            <Link href="/admin/events" className="card">
              <FiCalendar className="text-blue-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Управление мероприятиями</h3>
              <p className="text-gray-600 text-sm">Редактирование и удаление всех событий</p>
            </Link>

            <Link href="/admin/ngo" className="card">
              <FiMapPin className="text-primary-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Управление НКО</h3>
              <p className="text-gray-600 text-sm">Все организации на платформе</p>
            </Link>

            <Link href="/admin/users" className="card">
              <FiUsers className="text-green-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Пользователи</h3>
              <p className="text-gray-600 text-sm">Управление волонтерами и НКО</p>
            </Link>

            <Link href="/admin/articles" className="card">
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center mb-4">
                <span className="text-purple-600 font-bold">A</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Статьи</h3>
              <p className="text-gray-600 text-sm">Образовательные ресурсы</p>
            </Link>

            <Link href="/admin/cities" className="card">
              <FiMapPin className="text-blue-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Города</h3>
              <p className="text-gray-600 text-sm">Справочник городов Росатома</p>
            </Link>

            <Link href="/admin/categories" className="card">
              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center mb-4">
                <span className="text-orange-600 font-bold">#</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Категории</h3>
              <p className="text-gray-600 text-sm">Направления помощи</p>
            </Link>

            <Link href="/admin/support" className="card">
              <FiMessageSquare className="text-accent-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Поддержка</h3>
              <p className="text-gray-600 text-sm">Обращения пользователей</p>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
