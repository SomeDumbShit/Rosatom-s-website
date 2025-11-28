'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { FiMapPin, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi'
import { toast } from 'react-hot-toast'

export default function AdminNGOPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      router.push('/')
    }
  }, [status, session, router])

  const { data: ngos, isLoading } = useQuery({
    queryKey: ['admin-ngos'],
    queryFn: async () => {
      const res = await fetch('/api/ngo')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: session?.user.role === 'ADMIN' || session?.user.role === 'MODERATOR',
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ngo/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      toast.success('НКО удалено')
      queryClient.invalidateQueries({ queryKey: ['admin-ngos'] })
    },
    onError: () => {
      toast.error('Ошибка при удалении')
    },
  })

  const blockMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/ngo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Статус обновлен')
      queryClient.invalidateQueries({ queryKey: ['admin-ngos'] })
    },
    onError: () => {
      toast.error('Ошибка при обновлении')
    },
  })

  if (status === 'loading' || !session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Filter NGOs by search query
  const filteredNGOs = ngos?.filter((ngo: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ngo.brandName.toLowerCase().includes(query) ||
      ngo.legalName?.toLowerCase().includes(query) ||
      ngo.city.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="container-custom py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Управление НКО</h1>
            <Link href="/admin" className="text-primary-600 hover:text-primary-700">
              ← К панели администратора
            </Link>
          </div>

          {/* Search */}
          <div className="card mb-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию НКО..."
                className="input-field pl-12 w-full"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Название</th>
                    <th className="text-left py-4 px-4">Город</th>
                    <th className="text-left py-4 px-4">Статус</th>
                    <th className="text-left py-4 px-4">Мероприятий</th>
                    <th className="text-left py-4 px-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNGOs && filteredNGOs.length > 0 ? filteredNGOs.map((ngo: any) => (
                    <tr key={ngo.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <Link href={`/ngo/${ngo.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                          {ngo.brandName}
                        </Link>
                      </td>
                      <td className="py-4 px-4">{ngo.city}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            ngo.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : ngo.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : ngo.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {ngo.status === 'APPROVED'
                            ? 'Одобрено'
                            : ngo.status === 'PENDING'
                            ? 'На модерации'
                            : ngo.status === 'REJECTED'
                            ? 'Отклонено'
                            : ngo.status === 'BLOCKED'
                            ? 'Заблокировано'
                            : ngo.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">{ngo._count?.events || 0}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/ngo/${ngo.id}/edit`}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            <FiEdit /> Редактировать
                          </Link>
                          {ngo.status !== 'BLOCKED' ? (
                            <button
                              onClick={() => blockMutation.mutate({ id: ngo.id, status: 'BLOCKED' })}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Заблокировать
                            </button>
                          ) : (
                            <button
                              onClick={() => blockMutation.mutate({ id: ngo.id, status: 'APPROVED' })}
                              className="text-green-600 hover:text-green-700 text-sm"
                            >
                              Разблокировать
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Удалить это НКО?')) {
                                deleteMutation.mutate(ngo.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            <FiTrash2 className="inline" /> Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        {searchQuery ? 'Ничего не найдено по запросу' : 'Нет НКО'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
