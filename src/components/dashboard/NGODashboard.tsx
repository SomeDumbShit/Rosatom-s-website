'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FiPlus, FiUsers, FiCalendar, FiAlertCircle, FiSettings } from 'react-icons/fi'

export default function NGODashboard() {
  const { data: session } = useSession()

  const { data: ngo, isLoading } = useQuery({
    queryKey: ['my-ngo'],
    queryFn: async () => {
      const res = await fetch('/api/ngo/my')
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error('Failed to fetch')
      }
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!ngo) {
    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Регистрация НКО</h1>
          <p className="text-gray-600 mb-8">
            Для начала работы вам необходимо зарегистрировать вашу организацию
          </p>
          <Link href="/dashboard/ngo/register" className="btn-primary inline-block">
            Зарегистрировать НКО
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{ngo.brandName}</h1>
            <p className="text-gray-600">Панель управления организацией</p>
          </div>
          <div className="flex gap-3">
            {ngo.status === 'PENDING' && (
              <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
                <FiAlertCircle />
                <span className="font-medium">На модерации</span>
              </div>
            )}
            {ngo.status === 'APPROVED' && (
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                <span className="font-medium">✓ Одобрено</span>
              </div>
            )}
            {ngo.status === 'REJECTED' && (
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
                <p className="font-medium">Отклонено</p>
                {ngo.rejectionReason && (
                  <p className="text-sm mt-1">{ngo.rejectionReason}</p>
                )}
              </div>
            )}
            <Link
              href="/dashboard/settings"
              className="btn-secondary flex items-center gap-2"
            >
              <FiSettings />
              Настройки
            </Link>
          </div>
        </div>
      </div>

      {ngo.status === 'PENDING' && (
        <div className="card bg-yellow-50 border-yellow-200 mb-8">
          <h3 className="font-bold mb-2">Ваша организация на модерации</h3>
          <p className="text-sm text-gray-700">
            Администратор портала проверяет данные вашей организации.
            После одобрения вы сможете создавать мероприятия и появитесь на карте.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <h3 className="text-gray-600 mb-2">Всего мероприятий</h3>
          <p className="text-3xl font-bold text-primary-600">{ngo._count?.events || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 mb-2">Активные</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 mb-2">Волонтеров</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 mb-2">Проектов</h3>
          <p className="text-3xl font-bold">{ngo._count?.projects || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/dashboard/events/create"
          className="card text-center py-12"
        >
          <FiPlus className="mx-auto mb-4 text-primary-600" size={48} />
          <h3 className="text-xl font-bold mb-2">Создать мероприятие</h3>
          <p className="text-gray-600">Опубликуйте новое волонтерское задание</p>
        </Link>

        <Link
          href={`/ngo/${ngo.id}`}
          className="card text-center py-12"
        >
          <FiUsers className="mx-auto mb-4 text-primary-600" size={48} />
          <h3 className="text-xl font-bold mb-2">Публичный профиль</h3>
          <p className="text-gray-600">Посмотреть, как выглядит ваша страница</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/ngo/profile" className="card">
          <h3 className="font-bold mb-2">Управление профилем</h3>
          <p className="text-sm text-gray-600">Редактировать информацию об организации</p>
        </Link>

        <Link href="/dashboard/events" className="card">
          <h3 className="font-bold mb-2">Мои мероприятия</h3>
          <p className="text-sm text-gray-600">Управление волонтерскими заданиями</p>
        </Link>

        <Link href="/dashboard/projects" className="card">
          <h3 className="font-bold mb-2">Портфолио проектов</h3>
          <p className="text-sm text-gray-600">Добавить завершенные проекты</p>
        </Link>
      </div>
    </div>
  )
}
