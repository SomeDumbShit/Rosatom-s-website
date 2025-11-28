'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { FiLock } from 'react-icons/fi'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка сброса пароля')
      }

      toast.success('Пароль успешно изменен!')
      router.push('/auth/signin')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        toast.success('Новый код отправлен на email')
      }
    } catch (error) {
      toast.error('Ошибка отправки кода')
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Email не указан</h1>
          <Link href="/auth/forgot-password" className="text-primary-600 hover:text-primary-700">
            Вернуться к сбросу пароля →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <FiLock className="mx-auto text-5xl text-primary-600 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Сброс пароля</h1>
          <p className="text-gray-600">
            Введите код из email <strong>{email}</strong>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Код подтверждения</label>
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

            <div>
              <label className="label">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="label">Подтвердите пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Сброс...' : 'Сбросить пароль'}
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
            <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900 text-sm">
              ← Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Загрузка...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
