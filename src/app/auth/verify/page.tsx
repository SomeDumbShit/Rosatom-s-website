'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Get user data from session storage (stored during registration)
  const getUserData = () => {
    if (typeof window === 'undefined') return null
    const data = sessionStorage.getItem('pendingRegistration')
    return data ? JSON.parse(data) : null
  }

  const userData = getUserData()
  const email = searchParams.get('email') || userData?.email

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userData) {
      toast.error('Данные регистрации не найдены')
      router.push('/auth/signup')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          code,
          password: userData.password,
          name: userData.name,
          role: userData.role,
          city: userData.city,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка верификации')
      }

      // Clear session storage
      sessionStorage.removeItem('pendingRegistration')

      toast.success('Email подтвержден! Теперь войдите в систему')
      router.push('/auth/signin')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!userData) return

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Новый код отправлен на email')
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Данные не найдены</h1>
          <Link href="/auth/signup" className="text-primary-600 hover:text-primary-700">
            Вернуться к регистрации →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Подтверждение email</h1>
          <p className="text-gray-600">
            Мы отправили код на <strong>{email}</strong>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Введите 6-значный код</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input-field text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                Код действителен в течение 15 минут
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-2">Не получили код?</p>
            <button
              onClick={handleResend}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Отправить повторно
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/auth/signup" className="text-gray-600 hover:text-gray-900 text-sm">
              ← Вернуться к регистрации
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Загрузка...
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  )
}
