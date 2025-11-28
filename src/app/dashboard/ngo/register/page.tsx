'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ROSATOM_CITIES, NGO_CATEGORIES, ORGANIZATION_TYPES } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import RichTextEditor from '@/components/editor/RichTextEditor'

export default function RegisterNGOPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    legalName: '',
    brandName: '',
    inn: '',
    description: '',
    city: '',
    address: '',
    organizationType: 'НКО',
    categories: [] as string[],
    phone: '',
    email: '',
    website: '',
  })

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/ngo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to register')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('НКО зарегистрировано! Ожидайте модерации.')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    registerMutation.mutate(formData)
  }

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container-custom max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">Регистрация НКО</h1>

          <div className="card">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                После отправки заявки ваша организация будет проверена администратором.
                После одобрения вы сможете создавать мероприятия и появитесь на карте.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Юридическое название организации *</label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Брендовое название (как будет отображаться) *</label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">ИНН организации *</label>
                <input
                  type="text"
                  value={formData.inn}
                  onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                  className="input-field"
                  required
                  pattern="[0-9]{10,12}"
                  title="Введите корректный ИНН (10 или 12 цифр)"
                />
              </div>

              <div>
                <label className="label">Город *</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Выберите город</option>
                  {ROSATOM_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Тип организации *</label>
                <select
                  value={formData.organizationType}
                  onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                  className="input-field"
                  required
                >
                  {ORGANIZATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Направления деятельности *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {NGO_CATEGORIES.map((category) => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
                {formData.categories.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">Выберите хотя бы одно направление</p>
                )}
              </div>

              <div>
                <label className="label">Описание деятельности *</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Опишите, чем занимается ваша организация, какую помощь оказываете и кому"
                  minHeight="200px"
                />
              </div>

              <div>
                <label className="label">Адрес *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  required
                  placeholder="Улица, дом, офис"
                />
              </div>

              <div>
                <label className="label">Телефон *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  required
                  placeholder="+7 (XXX) XXX-XX-XX"
                />
              </div>

              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Сайт (опционально)</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={registerMutation.isPending || formData.categories.length === 0}
                  className="btn-primary disabled:opacity-50"
                >
                  {registerMutation.isPending ? 'Отправка...' : 'Зарегистрировать НКО'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="btn-secondary"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
