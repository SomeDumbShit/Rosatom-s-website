'use client'

import { useEffect, useRef, useState } from 'react'

interface NGOMiniMapProps {
  latitude: number
  longitude: number
  ngoName: string
  address: string
}

export default function NGOMiniMap({ latitude, longitude, ngoName, address }: NGOMiniMapProps) {
  const mapRef = useRef<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const mapId = `ngo-map-${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    let mounted = true
    let mapInstance: any = null

    function initMap() {
      if (!mounted) return

      try {
        const mapElement = document.getElementById(mapId)
        if (!mapElement) {
          console.log('Map element not found yet, retrying...')
          setTimeout(initMap, 100)
          return
        }

        // @ts-ignore
        if (!window.ymaps) {
          console.log('Yandex Maps not loaded yet')
          return
        }

        // @ts-ignore
        mapInstance = new ymaps.Map(mapId, {
          center: [latitude, longitude],
          zoom: 15,
          controls: ['zoomControl'],
        })

        // Add placemark for NGO
        // @ts-ignore
        const placemark = new ymaps.Placemark(
          [latitude, longitude],
          {
            balloonContentHeader: `<strong>${ngoName}</strong>`,
            balloonContentBody: `<p>${address}</p>`,
            hintContent: ngoName,
          },
          {
            preset: 'islands#redCircleDotIcon',
            iconColor: '#0066CC',
          }
        )

        mapInstance.geoObjects.add(placemark)
        mapRef.current = mapInstance
        setIsMapLoaded(true)
      } catch (error) {
        console.error('Error initializing NGO mini map:', error)
      }
    }

    // Check if Yandex Maps is already loaded
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
  }, [latitude, longitude, ngoName, address, mapId])

  return (
    <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
      <div id={mapId} className="w-full h-full"></div>
      {!isMapLoaded && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-500 bg-gray-200">
          Загрузка карты...
        </div>
      )}
    </div>
  )
}
