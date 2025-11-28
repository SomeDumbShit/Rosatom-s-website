'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

declare global {
  interface Window {
    VKIDSDK?: any
  }
}

export default function VKIDButton() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Load VK ID SDK script
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js'
    script.async = true

    script.onload = () => {
      initVKID()
    }

    script.onerror = () => {
      setError('Failed to load VK ID SDK')
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const initVKID = () => {
    if (!window.VKIDSDK || !containerRef.current) return

    const VKID = window.VKIDSDK

    try {
      // Initialize VK ID SDK
      VKID.Config.init({
        app: 54324591, // Your VK app ID
        redirectUrl: 'https://rosatom-volunteer-portal.vercel.app/api/auth/callback/vk',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: 'email', // Request email access
      })

      // Create OAuth button
      const oAuth = new VKID.OAuthList()

      oAuth.render({
        container: containerRef.current,
        oauthList: ['vkid'] // Only VK ID
      })
      .on(VKID.WidgetEvents.ERROR, vkidOnError)
      .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, async function (payload: any) {
        setIsLoading(true)
        setError(null)

        const code = payload.code
        const deviceId = payload.device_id

        try {
          // Exchange code for token using VK ID SDK
          const authData = await VKID.Auth.exchangeCode(code, deviceId)
          await vkidOnSuccess(authData)
        } catch (err) {
          vkidOnError(err)
        }
      })
    } catch (err) {
      setError('Failed to initialize VK ID')
    }
  }

  const vkidOnSuccess = async (data: any) => {
    try {
      // Extract token and user info from VK response
      const token = data.token || data.access_token
      const userId = data.user?.id || data.user_id

      if (!token || !userId) {
        throw new Error('Missing VK authentication data')
      }

      // Use NextAuth signIn with VK credentials
      const result = await signIn('credentials', {
        vkToken: token,
        vkUserId: userId.toString(),
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      if (result?.ok) {
        // Redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        throw new Error('Authentication failed')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
      setIsLoading(false)
    }
  }

  const vkidOnError = (error: any) => {
    setError('VK authentication failed. Please try again.')
    setIsLoading(false)
  }

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full">
        {/* VK ID button will be rendered here */}
      </div>

      {isLoading && (
        <div className="mt-2 text-sm text-gray-600 text-center">
          Authenticating...
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">
          {error}
        </div>
      )}
    </div>
  )
}
