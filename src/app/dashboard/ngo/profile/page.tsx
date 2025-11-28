'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'
import { ROSATOM_CITIES, NGO_CATEGORIES, ORGANIZATION_TYPES } from '@/lib/utils'
import RichTextEditor from '@/components/editor/RichTextEditor'

export default function NGOProfileEditPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: ngo, isLoading } = useQuery({
    queryKey: ['my-ngo'],
    queryFn: async () => {
      const res = await fetch('/api/ngo/my')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const [formData, setFormData] = useState({
    brandName: '',
    legalName: '',
    inn: '',
    description: '',
    mission: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    vkLink: '',
    telegramLink: '',
    instagramLink: '',
    logo: '',
    categories: [] as string[],
    organizationType: '',
  })

  useEffect(() => {
    if (ngo) {
      setFormData({
        brandName: ngo.brandName || '',
        legalName: ngo.legalName || '',
        inn: ngo.inn || '',
        description: ngo.description || '',
        mission: ngo.mission || '',
        city: ngo.city || '',
        address: ngo.address || '',
        phone: ngo.phone || '',
        email: ngo.email || '',
        website: ngo.website || '',
        vkLink: ngo.vkLink || '',
        telegramLink: ngo.telegramLink || '',
        instagramLink: ngo.instagramLink || '',
        logo: ngo.logo || '',
        categories: ngo.categories || [],
        organizationType: ngo.organizationType || '',
      })
    }
  }, [ngo])

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/ngo/${ngo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Профиль успешно обновлен!')
      queryClient.invalidateQueries({ queryKey: ['my-ngo'] })
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!ngo) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">НКО не найдено</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary">
              Вернуться в дашборд
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container-custom max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Редактирование профиля</h1>
            <p className="text-gray-600">Обновите информацию о вашей организации</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Основная информация</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Название бренда *</label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Юридическое название *</label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">ИНН *</label>
                  <input
                    type="text"
                    value={formData.inn}
                    onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                    className="input-field"
                    disabled
                    title="ИНН нельзя изменить"
                  />
                </div>

                <div>
                  <label className="label">Тип организации *</label>
                  <select
                    value={formData.organizationType}
                    onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Выберите тип</option>
                    {ORGANIZATION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="label">Описание *</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Расскажите о вашей организации..."
                  minHeight="200px"
                />
              </div>

              <div className="mt-6">
                <label className="label">Миссия</label>
                <RichTextEditor
                  value={formData.mission}
                  onChange={(value) => setFormData({ ...formData, mission: value })}
                  placeholder="Наша миссия..."
                  minHeight="150px"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Направления деятельности *</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {NGO_CATEGORIES.map(category => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="rounded"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Местоположение</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Город *</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Выберите город</option>
                    {ROSATOM_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Адрес *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field"
                    required
                    placeholder="Улица, дом"
                  />
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Контакты</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Телефон *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    required
                    placeholder="+7 (999) 123-45-67"
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
                    placeholder="info@example.ru"
                  />
                </div>

                <div>
                  <label className="label">Веб-сайт</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="input-field"
                    placeholder="https://example.ru"
                  />
                </div>

                <div>
                  <label className="label">ВКонтакте</label>
                  <input
                    type="url"
                    value={formData.vkLink}
                    onChange={(e) => setFormData({ ...formData, vkLink: e.target.value })}
                    className="input-field"
                    placeholder="https://vk.com/..."
                  />
                </div>

                <div>
                  <label className="label">Telegram</label>
                  <input
                    type="url"
                    value={formData.telegramLink}
                    onChange={(e) => setFormData({ ...formData, telegramLink: e.target.value })}
                    className="input-field"
                    placeholder="https://t.me/..."
                  />
                </div>

                <div>
                  <label className="label">Instagram</label>
                  <input
                    type="url"
                    value={formData.instagramLink}
                    onChange={(e) => setFormData({ ...formData, instagramLink: e.target.value })}
                    className="input-field"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Logo */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Логотип организации</h2>

              {formData.logo && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Текущий логотип:</p>
                  <img
                    src={formData.logo}
                    alt="Логотип"
                    className="w-32 h-32 object-contain border rounded p-2"
                  />
                </div>
              )}

              <div>
                <label className="label">URL логотипа</label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Укажите прямую ссылку на изображение логотипа вашей организации
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
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
      </main>

      <Footer />
    </div>
  )
}
