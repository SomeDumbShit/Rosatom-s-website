'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { NGO_CATEGORIES, HELP_TYPES } from '@/lib/utils'

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      router.push('/')
    }
  }, [status, session, router])

  if (status === 'loading' || !session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="container-custom py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Справочник категорий</h1>
            <Link href="/admin" className="text-primary-600 hover:text-primary-700">
              ← К панели администратора
            </Link>
          </div>

          <div className="space-y-8">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Категории НКО</h2>
              <p className="text-gray-600 mb-6">
                Основные направления деятельности некоммерческих организаций
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {NGO_CATEGORIES.map((category, index) => (
                  <div key={index} className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-sm font-medium text-primary-900">{category}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-4">Типы помощи</h2>
              <p className="text-gray-600 mb-6">
                Виды волонтерской помощи, которые могут запрашивать НКО
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {HELP_TYPES.map((type, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900">{type}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card bg-blue-50 border border-blue-200">
              <h3 className="font-bold mb-2">Информация</h3>
              <p className="text-sm text-gray-700">
                Категории и типы помощи определены на основе анализа потребностей НКО в городах Росатома.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
