'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiMapPin } from 'react-icons/fi'

// Helper function to strip HTML tags from text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

interface NGO {
  id: string
  brandName: string
  logo: string | null
  city: string
  categories: string[]
  description: string
}

interface Props {
  limit?: number
}

export default function NGOCatalog({ limit = 8 }: Props) {
  const [selectedCity, setSelectedCity] = useState<string>('')

  useEffect(() => {
    // Load selected city from localStorage
    const savedCity = localStorage.getItem('selectedCity')
    if (savedCity) {
      setSelectedCity(savedCity)
    }

    // Listen to city changes
    const handleCityChange = (event: CustomEvent) => {
      setSelectedCity(event.detail || '')
    }

    window.addEventListener('cityChanged' as any, handleCityChange)
    return () => window.removeEventListener('cityChanged' as any, handleCityChange)
  }, [])

  const { data: ngos, isLoading } = useQuery<NGO[]>({
    queryKey: ['ngos-catalog', limit, selectedCity],
    queryFn: async () => {
      const url = selectedCity
        ? `/api/ngo?limit=${limit}&city=${encodeURIComponent(selectedCity)}`
        : `/api/ngo?limit=${limit}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch NGOs')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-72"></div>
        ))}
      </div>
    )
  }

  if (!ngos || ngos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Нет зарегистрированных НКО</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ngos.map((ngo) => (
          <Link
            key={ngo.id}
            href={`/ngo/${ngo.id}`}
            className="card"
          >
            <div className="aspect-square relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
              {ngo.logo ? (
                <Image
                  src={ngo.logo}
                  alt={ngo.brandName}
                  fill
                  className="object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                  {ngo.brandName[0]}
                </div>
              )}
            </div>

            <h3 className="font-bold text-lg mb-2 line-clamp-1">{ngo.brandName}</h3>

            <div className="flex items-center text-sm text-gray-600 mb-3">
              <FiMapPin className="mr-1" />
              <span>{ngo.city}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {ngo.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded"
                >
                  {cat}
                </span>
              ))}
              {ngo.categories.length > 2 && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  +{ngo.categories.length - 2}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">{stripHtml(ngo.description)}</p>
          </Link>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link href="/ngo" className="btn-primary">
          Смотреть все НКО
        </Link>
      </div>
    </>
  )
}
