'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { FiMail } from 'react-icons/fi'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка отправки кода')
      }

      toast.success('Код для сброса пароля отправлен на email!')
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <FiMail className="mx-auto text-5xl text-primary-600 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Забыли пароль?</h1>
          <p className="text-gray-600">
            Введите ваш email и мы отправим код для сброса пароля
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Отправить код'}
            </button>
          </form>

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
