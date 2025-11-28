'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import VideoPlayer from '@/components/VideoPlayer'
import Image from 'next/image'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const { data: session } = useSession()

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${params.slug}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Статья не найдена</h1>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Check if article is unpublished and user is not admin
  if (!article.published && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Статья не опубликована</h1>
            <p className="text-gray-600">Эта статья еще не доступна для просмотра</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <article className="container-custom max-w-4xl">
          {/* Video Player for knowledge base items */}
          {article.videoUrl ? (
            <div className="mb-8">
              <VideoPlayer videoUrl={article.videoUrl} title={article.title} />
            </div>
          ) : article.coverImage ? (
            <div className="aspect-video relative bg-gray-100 rounded-xl overflow-hidden mb-8">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="card">
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                {article.category === 'ngo' ? 'Для НКО' : article.category === 'volunteers' ? 'Для Волонтеров' : article.category}
              </span>
              <span className="text-gray-500 text-sm">
                {format(new Date(article.createdAt), 'd MMMM yyyy', { locale: ru })}
              </span>
              {article.speaker && (
                <span className="text-gray-700 text-sm">
                  <strong>Спикер:</strong> {article.speaker}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold mb-6">{article.title}</h1>

            {article.excerpt && (
              <p className="text-xl text-gray-600 mb-8">{article.excerpt}</p>
            )}

            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* PDF Document Display */}
            {article.pdfUrl && (() => {
              const isGoogleDrive = article.pdfUrl.includes('drive.google.com') || article.pdfUrl.includes('docs.google.com')
              const isYandexDisk = article.pdfUrl.includes('disk.yandex.ru')

              // Convert Google Drive links to viewer format
              let viewerUrl = article.pdfUrl
              if (isGoogleDrive) {
                const fileIdMatch = article.pdfUrl.match(/\/d\/([^\/]+)/)
                if (fileIdMatch) {
                  viewerUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
                }
              }

              // For Yandex Disk, use their preview
              if (isYandexDisk && !article.pdfUrl.includes('/i/')) {
                // If it's a share link, we can't embed it easily
                return (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4">Документ PDF</h3>
                    <div className="card bg-blue-50 border-blue-200">
                      <div className="flex items-start gap-4">
                        <svg className="w-12 h-12 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1">
                          <p className="font-semibold mb-2">PDF документ доступен для просмотра</p>
                          <p className="text-sm text-gray-600 mb-4">
                            Файл размещен на Яндекс.Диске. Нажмите кнопку ниже, чтобы открыть документ.
                          </p>
                          <a
                            href={article.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary inline-flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Открыть PDF на Яндекс.Диске
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Документ PDF</h3>
                  {isGoogleDrive || isYandexDisk ? (
                    <div className="space-y-4">
                      <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ height: '600px' }}>
                        <iframe
                          src={viewerUrl}
                          className="w-full h-full"
                          title={`PDF: ${article.title}`}
                          allow="autoplay"
                        />
                      </div>
                      <div className="text-center">
                        <a
                          href={article.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Открыть в новой вкладке
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border rounded-lg overflow-hidden bg-gray-50">
                        <iframe
                          src={article.pdfUrl}
                          className="w-full min-h-[600px]"
                          title={`PDF: ${article.title}`}
                        />
                      </div>
                      <div className="text-center">
                        <a
                          href={article.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Скачать PDF
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Display tags */}
            {article.tags && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Теги:</h3>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(article.tags).map((tag: string) => (
                    <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
