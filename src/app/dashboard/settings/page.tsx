'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { FiUser, FiMail, FiLock, FiSave } from 'react-icons/fi'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
  })

  const [emailData, setEmailData] = useState({
    newEmail: '',
    code: '',
  })
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input')

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    code: '',
  })
  const [passwordStep, setPasswordStep] = useState<'request' | 'confirm'>('request')

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          email: session?.user?.email, // Keep current email
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка обновления профиля')
      }

      // Update session - trigger will fetch fresh data from DB
      await update()

      toast.success('Имя успешно обновлено!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/user/request-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail: emailData.newEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка запроса смены email')
      }

      toast.success('Код подтверждения отправлен на ваш текущий email!')
      setEmailStep('verify')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/user/confirm-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: emailData.code,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка подтверждения смены email')
      }

      toast.success('Email успешно изменен!')

      // Update session - trigger will fetch fresh data from DB
      await update()

      setEmailData({ newEmail: '', code: '' })
      setEmailStep('input')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/user/request-password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка запроса смены пароля')
      }

      toast.success('Код подтверждения отправлен на email!')
      setPasswordStep('confirm')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Новые пароли не совпадают')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: passwordData.code,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка смены пароля')
      }

      toast.success('Пароль успешно изменен!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        code: '',
      })
      setPasswordStep('request')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container-custom max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Настройки аккаунта</h1>

        <div className="space-y-6">
          {/* Account Info */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiUser />
              Информация об аккаунте
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">ID аккаунта:</span>
                <span className="font-mono text-gray-800">{session.user.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Роль:</span>
                <span className="font-medium">
                  {session.user.role === 'VOLUNTEER' && 'Волонтер'}
                  {session.user.role === 'NGO' && 'НКО'}
                  {session.user.role === 'ADMIN' && 'Администратор'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{session.user.email}</span>
              </div>
            </div>
          </div>

          {/* Profile Settings */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiUser />
              Изменить имя
            </h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="label">Имя</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex items-center gap-2"
              >
                <FiSave />
                {isLoading ? 'Сохранение...' : 'Сохранить имя'}
              </button>
            </form>
          </div>

          {/* Email Change */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiMail />
              Изменить email
            </h2>

            {emailStep === 'input' ? (
              <form onSubmit={handleRequestEmailChange} className="space-y-4">
                <div>
                  <label className="label">Текущий email</label>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    className="input-field bg-gray-100"
                    disabled
                  />
                </div>

                <div>
                  <label className="label">Новый email</label>
                  <input
                    type="email"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                    className="input-field"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Код подтверждения будет отправлен на ваш текущий email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiMail />
                  {isLoading ? 'Отправка...' : 'Отправить код подтверждения'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmEmailChange} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Код подтверждения отправлен на <strong>{session?.user?.email}</strong>
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    Новый email: <strong>{emailData.newEmail}</strong>
                  </p>
                </div>

                <div>
                  <label className="label">Код подтверждения</label>
                  <input
                    type="text"
                    value={emailData.code}
                    onChange={(e) => setEmailData({ ...emailData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="input-field text-center text-xl tracking-widest font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FiMail />
                    {isLoading ? 'Подтверждение...' : 'Подтвердить смену email'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep('input')
                      setEmailData({ newEmail: '', code: '' })
                    }}
                    className="btn-secondary"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Password Change */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiLock />
              Изменить пароль
            </h2>

            {passwordStep === 'request' ? (
              <form onSubmit={handleRequestPasswordChange} className="space-y-4">
                <div>
                  <label className="label">Текущий пароль</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiLock />
                  {isLoading ? 'Отправка...' : 'Отправить код на email'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordChange} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Код подтверждения отправлен на <strong>{session?.user?.email}</strong>
                  </p>
                </div>

                <div>
                  <label className="label">Код подтверждения</label>
                  <input
                    type="text"
                    value={passwordData.code}
                    onChange={(e) => setPasswordData({ ...passwordData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="input-field text-center text-xl tracking-widest font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="label">Новый пароль</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input-field"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="label">Подтвердите новый пароль</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="input-field"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiLock />
                  {isLoading ? 'Изменение...' : 'Изменить пароль'}
                </button>
              </form>
            )}
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
