'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { ROSATOM_CITIES } from '@/lib/utils'

export default function AdminCitiesPage() {
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
            <h1 className="text-3xl font-bold">Справочник городов Росатома</h1>
            <Link href="/admin" className="text-primary-600 hover:text-primary-700">
              ← К панели администратора
            </Link>
          </div>

          <div className="card">
            <p className="text-gray-600 mb-6">
              Это стационарный справочник всех 32 городов присутствия Росатома.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ROSATOM_CITIES.map((city, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium">{city}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold mb-2">Информация</h3>
              <p className="text-sm text-gray-700">
                Список городов определен техническим заданием хакатона.
                Всего: {ROSATOM_CITIES.length} городов.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
