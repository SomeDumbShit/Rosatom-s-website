'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export default function MapWidget() {
  const mapRef = useRef<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    let mapInstance: any = null

    function initMap() {
      if (!mounted) return

      try {
        // Wait for element to be available
        const mapElement = document.getElementById('preview-map')
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
        mapInstance = new ymaps.Map('preview-map', {
          center: [55.75, 37.57],
          zoom: 3,
          controls: [],
        }, {
          suppressMapOpenBlock: true,
        })

        // Disable all interactions for preview
        mapInstance.behaviors.disable(['drag', 'scrollZoom', 'dblClickZoom', 'multiTouch'])
        mapRef.current = mapInstance
        setIsMapLoaded(true)

        // Fetch NGOs to show on map
        fetch('/api/ngo?status=APPROVED&limit=50')
          .then((res) => res.json())
          .then((ngos) => {
            if (!mounted || !mapInstance) return
            ngos.forEach((ngo: any) => {
              if (ngo.latitude && ngo.longitude) {
                // @ts-ignore
                const placemark = new ymaps.Placemark(
                  [ngo.latitude, ngo.longitude],
                  {},
                  {
                    preset: 'islands#blueCircleDotIcon',
                    iconColor: '#2563eb',
                  }
                )
                mapInstance.geoObjects.add(placemark)
              }
            })
          })
          .catch((error) => {
            console.error('Failed to load NGOs for map preview:', error)
          })
      } catch (error) {
        console.error('Error initializing preview map:', error)
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
      existingScript.addEventListener('load', () => {
        // @ts-ignore
        if (window.ymaps && mounted) {
          // @ts-ignore
          ymaps.ready(initMap)
        }
      })
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

    // Load Yandex Maps script
    const script = document.createElement('script')
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
    script.async = true

    script.onload = () => {
      // @ts-ignore
      if (window.ymaps && mounted) {
        // @ts-ignore
        ymaps.ready(initMap)
      }
    }

    script.onerror = (error) => {
      console.error('Failed to load Yandex Maps script:', error)
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

  return (
    <div className="relative">
      <div
        id="preview-map"
        className="bg-gray-200 rounded-xl h-96 overflow-hidden relative"
        ref={mapRef}
      >
        {!isMapLoaded && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-400 bg-gray-200 z-10">
            Загрузка карты...
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Link
          href="/map"
          className="bg-white text-primary-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-xl"
        >
          Открыть полную карту
        </Link>
      </div>

      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-xs z-10">
        <p className="text-sm text-gray-600">
          На карте отмечены все проверенные НКО в городах Росатома
        </p>
      </div>
    </div>
  )
}
