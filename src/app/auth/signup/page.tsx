'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { ROSATOM_CITIES } from '@/lib/utils'
import VKIDButton from '@/components/auth/VKIDButton'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: type === 'ngo' ? 'NGO' : 'VOLUNTEER',
    city: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)

    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        city: formData.city,
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при регистрации')
      }

      // Store registration data in session storage for verification
      sessionStorage.setItem('pendingRegistration', JSON.stringify(registrationData))

      toast.success('Код подтверждения отправлен на email!')
      router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Регистрация</h1>
          <p className="mt-2 text-gray-600">
            {formData.role === 'NGO'
              ? 'Создайте аккаунт для вашей организации'
              : 'Создайте аккаунт волонтера'}
          </p>
        </div>

        <div className="card">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'VOLUNTEER' })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                formData.role === 'VOLUNTEER'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Волонтер
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'NGO' })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                formData.role === 'NGO'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              НКО
            </button>
          </div>

          {/* VK ID SDK Button */}
          <VKIDButton />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">или через email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Имя</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Иван Иванов"
                required
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="label">Город</label>
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
              <label className="label">Пароль</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="label">Подтвердите пароль</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Уже есть аккаунт?{' '}
              <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700 font-medium">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Загрузка...</div>}>
      <SignUpForm />
    </Suspense>
  )
}
