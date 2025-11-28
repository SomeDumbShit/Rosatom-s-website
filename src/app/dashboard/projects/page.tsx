'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { FiPlus } from 'react-icons/fi'

export default function ProjectsPage() {
  const router = useRouter()

  const { data: ngo } = useQuery({
    queryKey: ['my-ngo'],
    queryFn: async () => {
      const res = await fetch('/api/ngo/my')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const { data: projects, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      if (!ngo) return []
      const res = await fetch(`/api/projects?ngoId=${ngo.id}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: !!ngo,
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Портфолио проектов</h1>
              <p className="text-gray-600">Покажите свои завершенные проекты</p>
            </div>
            <Link href="/dashboard/projects/create" className="btn-primary flex items-center space-x-2">
              <FiPlus />
              <span>Добавить проект</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64"></div>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <div key={project.id} className="card">
                  <h3 className="font-bold text-lg mb-3">{project.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-4 mb-4">{project.description}</p>
                  {project.images?.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {project.images.length} фото
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <h3 className="text-xl font-bold mb-2">Нет добавленных проектов</h3>
              <p className="text-gray-600 mb-6">Покажите свои достижения волонтерам</p>
              <Link href="/dashboard/projects/create" className="btn-primary inline-block">
                Добавить проект
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
