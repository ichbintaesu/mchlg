'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { sendClientEvent } from '@/lib/client-events'

type Status = 'idle' | 'locating' | 'denied' | 'error'

export function HereClient({ source }: { source?: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const router = useRouter()
  const t = useTranslations('here')
  const tErrors = useTranslations('errors')

  const locate = () => {
    setStatus('locating')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch('/api/geo/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source,
            }),
          })
          if (!res.ok) {
            setStatus('error')
            return
          }
          const data: { redirectUrl: string } = await res.json()
          router.replace(data.redirectUrl)
        } catch {
          setStatus('error')
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied')
          sendClientEvent({ type: 'geo_denied', source })
        } else {
          setStatus('error')
          sendClientEvent({
            type: 'geo_error',
            source,
            meta: { code: error.code, message: error.message },
          })
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }

  if (status === 'locating') {
    return <p className="text-sm text-stone-500">{t('locating')}</p>
  }

  if (status === 'denied') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-stone-700">{t('denied')}</p>
        <p className="text-xs text-stone-500">{t('deniedHint')}</p>
        <button
          onClick={locate}
          className="rounded-full border border-stone-300 px-6 py-2 text-sm"
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-stone-700">{tErrors('generic')}</p>
        <button
          onClick={locate}
          className="rounded-full border border-stone-300 px-6 py-2 text-sm"
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="max-w-xs text-xs text-stone-500">{t('intro')}</p>
      <button
        onClick={locate}
        className="rounded-full bg-stone-900 px-8 py-3 font-medium text-stone-50"
      >
        {t('request')}
      </button>
    </div>
  )
}
