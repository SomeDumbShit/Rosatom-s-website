'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ROSATOM_CITIES, NGO_CATEGORIES, CITY_COORDINATES, NGO_CATEGORIES_MAP, NGO_TAGS_TO_LABELS } from '@/lib/utils'

// Helper function to strip HTML tags from text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

interface NGO {
  id: string
  brandName: string
  description: string
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  categories: string[]
  phone: string
  email: string
  website?: string
  logo?: string
  organizationType: string
}

export default function MapPage() {
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [needsHelp, setNeedsHelp] = useState(false)
  const [ngos, setNGOs] = useState<NGO[]>([])
  const [filteredNGOs, setFilteredNGOs] = useState<NGO[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredNGO, setHoveredNGO] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const mapRef = useRef<any>(null)
  const placemarkRefs = useRef<Map<string, any>>(new Map())
  const clustererRef = useRef<any>(null)

  // Загрузка НКО из API
  useEffect(() => {
    const fetchNGOs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/ngo?status=APPROVED')
        if (response.ok) {
          const data = await response.json()
          setNGOs(data)
          setFilteredNGOs(data)
        }
      } catch (error) {
        console.error('Failed to fetch NGOs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNGOs()
  }, [])

  // Фильтрация НКО
  useEffect(() => {
    let filtered = ngos

    if (selectedCities.length > 0) {
      filtered = filtered.filter((ngo) => selectedCities.includes(ngo.city))
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((ngo) =>
        ngo.categories.some((cat) => {
          // Check if category matches directly (Russian label)
          if (selectedCategories.includes(cat)) return true

          // Check if category is an English tag and selected category is Russian label
          const russianLabel = NGO_TAGS_TO_LABELS[cat as keyof typeof NGO_TAGS_TO_LABELS]
          if (russianLabel && selectedCategories.includes(russianLabel)) return true

          // Check if category is Russian label and selected category is English tag
          const englishTag = NGO_CATEGORIES_MAP[cat as keyof typeof NGO_CATEGORIES_MAP]
          if (englishTag && selectedCategories.includes(englishTag)) return true

          return false
        })
      )
    }

    if (needsHelp) {
      // Можно добавить логику фильтрации НКО, которым нужна помощь
      // Например, фильтровать по наличию активных событий
    }

    setFilteredNGOs(filtered)
  }, [selectedCities, selectedCategories, needsHelp, ngos])

  // Инициализация карты
  useEffect(() => {
    let mounted = true
    let mapInstance: any = null

    function initMap() {
      if (!mounted) return

      // Prevent double initialization
      if (mapRef.current) {
        console.log('Map already initialized')
        return
      }

      try {
        const mapElement = document.getElementById('map')
        if (!mapElement) {
          console.log('Map element not found')
          return
        }

        // @ts-ignore
        mapInstance = new ymaps.Map('map', {
          center: [55.75, 37.57],
          zoom: 5,
          controls: ['zoomControl', 'fullscreenControl', 'geolocationControl'],
        })

        mapRef.current = mapInstance

        // Create clusterer for grouping nearby markers
        // @ts-ignore
        const clusterer = new ymaps.Clusterer({
          preset: 'islands#invertedBlueClusterIcons',
          groupByCoordinates: false,
          clusterDisableClickZoom: false,
          clusterHideIconOnBalloonOpen: false,
          geoObjectHideIconOnBalloonOpen: false,
        })

        clustererRef.current = clusterer
        mapInstance.geoObjects.add(clusterer)
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    // Check if script already loaded
    // @ts-ignore
    if (typeof window !== 'undefined' && window.ymaps) {
      // @ts-ignore
      ymaps.ready(initMap)
      return () => {
        mounted = false
        if (mapInstance) {
          try {
            mapInstance.destroy()
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]')
    if (existingScript) {
      // Wait for ymaps to be available
      const checkYmaps = setInterval(() => {
        // @ts-ignore
        if (window.ymaps && mounted) {
          clearInterval(checkYmaps)
          // @ts-ignore
          ymaps.ready(initMap)
        }
      }, 100)

      return () => {
        clearInterval(checkYmaps)
        mounted = false
        if (mapInstance) {
          try {
            mapInstance.destroy()
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    }

    // Load Yandex Maps script
    const script = document.createElement('script')
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
    script.async = true
    script.defer = true

    script.onload = () => {
      // @ts-ignore
      if (window.ymaps && mounted) {
        // @ts-ignore
        ymaps.ready(initMap)
      }
    }

    script.onerror = () => {
      // Simplified error handler to avoid cross-origin issues
      console.error('Failed to load Yandex Maps script')
    }

    document.body.appendChild(script)

    return () => {
      mounted = false
      if (mapInstance) {
        try {
          mapInstance.destroy()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  // Обновление меток на карте при изменении отфильтрованных НКО
  useEffect(() => {
    if (!clustererRef.current) return

    // Clear existing placemarks
    clustererRef.current.removeAll()
    placemarkRefs.current.clear()

    // Add placemarks for filtered NGOs
    filteredNGOs.forEach((ngo) => {
      // Используем координаты НКО или координаты города по умолчанию
      let coordinates: [number, number] | null = null

      if (ngo.latitude && ngo.longitude) {
        coordinates = [ngo.latitude, ngo.longitude]
      } else if (CITY_COORDINATES[ngo.city]) {
        coordinates = CITY_COORDINATES[ngo.city]
      }

      if (coordinates) {
        // @ts-ignore
        const placemark = new ymaps.Placemark(
          coordinates,
          {
            balloonContentHeader: `<strong>${ngo.brandName}</strong>`,
            balloonContentBody: `
              <div style="max-width: 300px;">
                <p style="margin: 8px 0;"><strong>Тип:</strong> ${ngo.organizationType}</p>
                <p style="margin: 8px 0;"><strong>Категории:</strong> ${ngo.categories.join(', ')}</p>
                <p style="margin: 8px 0;">${stripHtml(ngo.description).substring(0, 150)}...</p>
                <p style="margin: 8px 0;"><strong>Адрес:</strong> ${ngo.address}</p>
                <p style="margin: 8px 0;"><strong>Телефон:</strong> ${ngo.phone}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> ${ngo.email}</p>
                ${ngo.website ? `<p style="margin: 8px 0;"><strong>Сайт:</strong> <a href="${ngo.website}" target="_blank">${ngo.website}</a></p>` : ''}
                <a href="/ngo/${ngo.id}" style="display: inline-block; margin-top: 12px; padding: 8px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px;">Подробнее</a>
              </div>
            `,
            hintContent: ngo.brandName,
          },
          {
            preset: 'islands#blueCircleDotIcon',
            iconColor: '#2563eb',
          }
        )

        placemarkRefs.current.set(ngo.id, placemark)
        clustererRef.current.add(placemark)
      }
    })

    // Auto-adjust map bounds to show all markers
    if (filteredNGOs.length > 0 && mapRef.current && clustererRef.current) {
      const bounds = clustererRef.current.getBounds()
      if (bounds) {
        mapRef.current.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: 50,
        })
      }
    }
  }, [filteredNGOs])

  // Обработка наведения на карточку НКО
  const handleNGOHover = (ngoId: string | null) => {
    setHoveredNGO(ngoId)

    if (ngoId && placemarkRefs.current.has(ngoId)) {
      const placemark = placemarkRefs.current.get(ngoId)
      placemark?.options.set('iconColor', '#dc2626')
    }

    // Reset all other placemarks
    placemarkRefs.current.forEach((placemark, id) => {
      if (id !== ngoId) {
        placemark.options.set('iconColor', '#2563eb')
      }
    })
  }

  // Центрирование карты на НКО при клике на карточку
  const handleNGOClick = (ngo: NGO) => {
    if (!mapRef.current) return

    let coordinates: [number, number] | null = null

    if (ngo.latitude && ngo.longitude) {
      coordinates = [ngo.latitude, ngo.longitude]
    } else if (CITY_COORDINATES[ngo.city]) {
      coordinates = CITY_COORDINATES[ngo.city]
    }

    if (coordinates && placemarkRefs.current.has(ngo.id)) {
      mapRef.current.setCenter(coordinates, 15, {
        checkZoomRange: true,
        duration: 500,
      })

      const placemark = placemarkRefs.current.get(ngo.id)
      placemark?.balloon.open()
    }
  }

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow flex relative h-screen md:h-auto">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-20 left-4 z-50 bg-white rounded-full p-3 shadow-lg"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {sidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Filters Panel */}
        <div
          className={`
            fixed md:relative
            top-0 left-0
            h-full
            w-full md:w-96
            bg-white
            border-r
            overflow-y-auto
            p-6
            transition-transform duration-300 ease-in-out
            z-40
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Интерактивная Карта</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="label">Города (можно выбрать несколько)</label>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                {ROSATOM_CITIES.map((city) => (
                  <label key={city} className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCities([...selectedCities, city])
                        } else {
                          setSelectedCities(selectedCities.filter((c) => c !== city))
                        }
                      }}
                      className="rounded"
                    />
                    <span>{city}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Направления</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {NGO_CATEGORIES.map((category) => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="rounded"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsHelp}
                  onChange={(e) => setNeedsHelp(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Только те, кому нужна помощь</span>
              </label>
            </div>
          </div>

          {/* Results List */}
          <div className="mt-8">
            <h2 className="font-bold mb-4">
              Найдено НКО: {loading ? '...' : filteredNGOs.length}
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Загрузка НКО...</p>
              </div>
            ) : filteredNGOs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">НКО не найдены</p>
                <p className="text-sm text-gray-500 mt-2">Попробуйте изменить фильтры</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNGOs.map((ngo) => (
                  <div
                    key={ngo.id}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all duration-200
                      ${hoveredNGO === ngo.id ? 'border-red-500 bg-red-50' : 'border-gray-200'}
                    `}
                    onMouseEnter={() => handleNGOHover(ngo.id)}
                    onMouseLeave={() => handleNGOHover(null)}
                    onClick={() => handleNGOClick(ngo)}
                  >
                    <div className="flex items-start space-x-3">
                      {ngo.logo ? (
                        <img
                          src={ngo.logo}
                          alt={ngo.brandName}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">{ngo.brandName}</h3>
                        <p className="text-xs text-gray-600 mt-1">{ngo.city}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{stripHtml(ngo.description)}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ngo.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat}
                              className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {cat}
                            </span>
                          ))}
                          {ngo.categories.length > 2 && (
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              +{ngo.categories.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-grow relative">
          <div id="map" className="w-full h-full"></div>
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
