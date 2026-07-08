'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { sendClientEvent } from '@/lib/client-events'

type Status = 'idle' | 'locating' | 'denied' | 'error'

const PRIMARY_BUTTON =
  'glossy rounded-full bg-stone-50 px-12 py-4 text-base font-semibold text-ink transition-transform duration-150 active:scale-95'

const GHOST_BUTTON =
  'glass rounded-full px-8 py-3 text-sm font-medium text-stone-100 transition-transform duration-150 active:scale-95'

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
    return (
      <div className="flex flex-col items-center gap-3">
        <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex size-3 rounded-full bg-accent" />
        </span>
        <p className="text-sm text-stone-400">{t('locating')}</p>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-stone-300">{t('denied')}</p>
        <p className="text-xs text-stone-500">{t('deniedHint')}</p>
        <button onClick={locate} className={GHOST_BUTTON}>
          {t('retry')}
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-stone-300">{tErrors('generic')}</p>
        <button onClick={locate} className={GHOST_BUTTON}>
          {t('retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="max-w-64 text-xs leading-relaxed text-stone-500">{t('intro')}</p>
      <button onClick={locate} className={PRIMARY_BUTTON}>
        {t('request')}
      </button>
    </div>
  )
}
