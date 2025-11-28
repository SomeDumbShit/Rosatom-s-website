'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { FiCheck, FiX, FiEye } from 'react-icons/fi'

export default function NGOModerationPage() {
  const queryClient = useQueryClient()
  const [selectedNGO, setSelectedNGO] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const { data: ngos, isLoading } = useQuery({
    queryKey: ['pending-ngos'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ngo/pending')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const res = await fetch(`/api/ngo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Статус обновлен')
      queryClient.invalidateQueries({ queryKey: ['pending-ngos'] })
      setSelectedNGO(null)
      setRejectionReason('')
    },
    onError: () => {
      toast.error('Ошибка при обновлении')
    },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container-custom">
          <h1 className="text-3xl font-bold mb-8">Модерация НКО</h1>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
              ))}
            </div>
          ) : ngos && ngos.length > 0 ? (
            <div className="space-y-4">
              {ngos.map((ngo: any) => (
                <div key={ngo.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold mb-2">{ngo.brandName}</h3>
                      <p className="text-gray-600 mb-2">{ngo.legalName}</p>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>ИНН: {ngo.inn}</span>
                        <span>{ngo.city}</span>
                        <span>{ngo.organizationType}</span>
                      </div>
                      {selectedNGO?.id === ngo.id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm mb-2"><strong>Описание:</strong></p>
                          <p className="text-sm text-gray-700">{ngo.description}</p>
                          <div className="mt-3">
                            <p className="text-sm"><strong>Контакты:</strong></p>
                            <p className="text-sm text-gray-600">{ngo.email} • {ngo.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedNGO(selectedNGO?.id === ngo.id ? null : ngo)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="Подробнее"
                      >
                        <FiEye size={20} />
                      </button>
                      <button
                        onClick={() => moderateMutation.mutate({ id: ngo.id, status: 'APPROVED' })}
                        className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        <FiCheck />
                        <span>Одобрить</span>
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Причина отклонения:')
                          if (reason) {
                            moderateMutation.mutate({ id: ngo.id, status: 'REJECTED', reason })
                          }
                        }}
                        className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        <FiX />
                        <span>Отклонить</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">Нет НКО на модерации</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
