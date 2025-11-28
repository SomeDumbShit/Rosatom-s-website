'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function VKIDWidget() {
  const [loading, setLoading] = useState(false)

  const handleVKLogin = async () => {
    try {
      setLoading(true)
      await signIn('vk', {
        callbackUrl: '/dashboard',
        redirect: true,
      })
    } catch (error) {
      console.error('VK Auth Error:', error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleVKLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0077FF] hover:bg-[#0066DD] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 23.04C0 12.1788 0 6.74826 3.37413 3.37413C6.74826 0 12.1788 0 23.04 0H24.96C35.8212 0 41.2517 0 44.6259 3.37413C48 6.74826 48 12.1788 48 23.04V24.96C48 35.8212 48 41.2517 44.6259 44.6259C41.2517 48 35.8212 48 24.96 48H23.04C12.1788 48 6.74826 48 3.37413 44.6259C0 41.2517 0 35.8212 0 24.96V23.04Z" fill="white"/>
        <path d="M25.54 34.5801C14.6 34.5801 8.3601 27.0801 8.1001 14.6001H13.5801C13.7601 23.7601 17.8 27.6401 21 28.4401V14.6001H26.1602V22.5001C29.3202 22.1801 32.6398 18.5601 33.7598 14.6001H38.9199C38.0599 19.4801 34.4599 23.0801 31.8999 24.5601C34.4599 25.7601 38.5601 28.9001 40.1201 34.5801H34.4395C33.2195 30.6801 30.1802 27.8201 26.1602 27.4201V34.5801H25.54Z" fill="#0077FF"/>
      </svg>
      {loading ? 'Вход...' : 'Войти через ВКонтакте'}
    </button>
  )
}
