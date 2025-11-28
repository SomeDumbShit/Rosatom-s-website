'use client'

import { useState, useEffect } from 'react'
import { ROSATOM_CITIES } from '@/lib/utils'
import { FaMapMarkerAlt } from 'react-icons/fa'

export default function CitySelector() {
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load selected city from localStorage
    const savedCity = localStorage.getItem('selectedCity')
    if (savedCity) {
      setSelectedCity(savedCity)
    }
  }, [])

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    localStorage.setItem('selectedCity', city)
    setIsOpen(false)
    // Trigger event for other components to listen to
    window.dispatchEvent(new CustomEvent('cityChanged', { detail: city }))
  }

  const clearCity = () => {
    setSelectedCity('')
    localStorage.removeItem('selectedCity')
    setIsOpen(false)
    window.dispatchEvent(new CustomEvent('cityChanged', { detail: '' }))
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FaMapMarkerAlt className="text-primary-600 text-2xl" />
          <h3 className="text-xl font-bold text-gray-800">Выберите ваш город</h3>
        </div>
        {selectedCity && (
          <button
            onClick={clearCity}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Показать все города
          </button>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 text-left bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-primary-600 focus:border-primary-600 focus:outline-none transition-colors"
        >
          {selectedCity || 'Все города Росатома'}
        </button>

        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
              <div className="p-2">
                <button
                  onClick={clearCity}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded font-medium text-gray-700"
                >
                  Все города
                </button>
                {ROSATOM_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCityChange(city)}
                    className={`w-full px-4 py-2 text-left hover:bg-primary-50 rounded transition-colors ${
                      selectedCity === city ? 'bg-primary-100 font-medium text-primary-700' : 'text-gray-700'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {selectedCity && (
        <p className="mt-4 text-sm text-gray-600">
          Контент на странице отфильтрован по городу: <span className="font-bold text-primary-600">{selectedCity}</span>
        </p>
      )}
    </div>
  )
}
