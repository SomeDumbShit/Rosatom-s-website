'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'
import RichTextEditor from '@/components/editor/RichTextEditor'

export default function CreateProjectPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Проект добавлен!')
      router.push('/dashboard/projects')
    },
    onError: () => {
      toast.error('Ошибка при создании проекта')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container-custom max-w-2xl">
          <h1 className="text-3xl font-bold mb-8">Добавить проект</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <div className="space-y-6">
                <div>
                  <label className="label">Название проекта *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Описание *</label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Расскажите о проекте, его целях и результатах..."
                    minHeight="250px"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="label">Дата начала</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Дата окончания</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" disabled={createMutation.isPending} className="btn-primary disabled:opacity-50">
                {createMutation.isPending ? 'Создание...' : 'Создать проект'}
              </button>
              <button type="button" onClick={() => router.push('/dashboard/projects')} className="btn-secondary">
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
