'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import VolunteerDashboard from '@/components/dashboard/VolunteerDashboard'
import NGODashboard from '@/components/dashboard/NGODashboard'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        {session.user.role === 'VOLUNTEER' && <VolunteerDashboard />}
        {session.user.role === 'NGO' && <NGODashboard />}
        {(session.user.role === 'ADMIN' || session.user.role === 'MODERATOR') && (
          <div className="container-custom py-12">
            <h1 className="text-3xl font-bold mb-4">
              {session.user.role === 'ADMIN' ? 'Админ-панель' : 'Панель модератора'}
            </h1>
            <p>Перейдите в <a href="/admin" className="text-primary-600">панель {session.user.role === 'ADMIN' ? 'администратора' : 'модератора'}</a></p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
