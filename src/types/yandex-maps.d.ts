// Type definitions for Yandex Maps API 2.1
// This is a simplified version for basic map functionality

declare global {
  interface Window {
    ymaps: typeof ymaps
  }

  namespace ymaps {
    function ready(callback: () => void): void

    class Map {
      constructor(
        container: string | HTMLElement,
        state: {
          center: [number, number]
          zoom: number
          controls?: string[]
        },
        options?: any
      )
      geoObjects: {
        add(geoObject: any): void
        remove(geoObject: any): void
      }
      setCenter(
        center: [number, number],
        zoom?: number,
        options?: { checkZoomRange?: boolean; duration?: number }
      ): void
      setBounds(
        bounds: number[][],
        options?: { checkZoomRange?: boolean; zoomMargin?: number }
      ): void
    }

    class Placemark {
      constructor(
        coordinates: [number, number],
        properties: {
          balloonContentHeader?: string
          balloonContentBody?: string
          balloonContentFooter?: string
          hintContent?: string
        },
        options?: {
          preset?: string
          iconColor?: string
        }
      )
      balloon: {
        open(): void
        close(): void
      }
      options: {
        set(key: string, value: any): void
        get(key: string): any
      }
    }

    class Clusterer {
      constructor(options?: {
        preset?: string
        groupByCoordinates?: boolean
        clusterDisableClickZoom?: boolean
        clusterHideIconOnBalloonOpen?: boolean
        geoObjectHideIconOnBalloonOpen?: boolean
      })
      add(placemark: Placemark): void
      removeAll(): void
      getBounds(): number[][] | null
    }
  }
}

export {}
