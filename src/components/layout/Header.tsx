'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { FiMenu, FiX, FiBell, FiUser } from 'react-icons/fi'

export default function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            {/* Desktop logo - расширенный */}
            <img
              src="/images/logo-full.png"
              alt="Росатом"
              className="hidden md:block h-12 w-auto"
            />
            {/* Mobile logo - компактный */}
            <img
              src="/images/logo-compact.png"
              alt="Росатом"
              className="md:hidden h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/map" className="text-gray-700 hover:text-primary-600 transition-colors">
              Карта
            </Link>
            <Link href="/ngo" className="text-gray-700 hover:text-primary-600 transition-colors">
              НКО
            </Link>
            <Link href="/events" className="text-gray-700 hover:text-primary-600 transition-colors">
              Мероприятия
            </Link>
            <Link href="/resources" className="text-gray-700 hover:text-primary-600 transition-colors">
              Ресурсы
            </Link>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : session ? (
              <>
                <Link href="/dashboard/notifications" className="relative p-2 text-gray-700 hover:text-primary-600">
                  <FiBell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Link>
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
                  >
                    <FiUser size={20} />
                    <span>{session.user?.name || 'Профиль'}</span>
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Личный кабинет
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Настройки
                      </Link>
                      <Link
                        href="/dashboard/support"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Поддержка
                      </Link>
                      {session.user?.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 hover:bg-gray-100 text-primary-600"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Админ-панель
                        </Link>
                      )}
                      {session.user?.role === 'MODERATOR' && (
                        <Link
                          href="/admin/ngo/moderation"
                          className="block px-4 py-2 hover:bg-gray-100 text-primary-600"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Модерация НКО
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false)
                          signOut()
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                      >
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="text-gray-700 hover:text-primary-600">
                  Войти
                </Link>
                <Link href="/auth/signup" className="btn-primary">
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link href="/map" className="text-gray-700 hover:text-primary-600">
                Карта
              </Link>
              <Link href="/ngo" className="text-gray-700 hover:text-primary-600">
                НКО
              </Link>
              <Link href="/events" className="text-gray-700 hover:text-primary-600">
                Мероприятия
              </Link>
              <Link href="/resources" className="text-gray-700 hover:text-primary-600">
                Ресурсы
              </Link>
              {session ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-primary-600">
                    Личный кабинет
                  </Link>
                  <Link href="/dashboard/settings" className="text-gray-700 hover:text-primary-600">
                    Настройки
                  </Link>
                  <Link href="/dashboard/support" className="text-gray-700 hover:text-primary-600">
                    Поддержка
                  </Link>
                  {(session.user?.role === 'ADMIN' || session.user?.role === 'MODERATOR') && (
                    <Link href="/admin" className="text-primary-600 hover:text-primary-700 font-medium">
                      {session.user.role === 'ADMIN' ? 'Админ-панель' : 'Модерация'}
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="text-left text-red-600"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-700 hover:text-primary-600">
                    Войти
                  </Link>
                  <Link href="/auth/signup" className="btn-primary text-center">
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
