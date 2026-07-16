'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { sendClientEvent } from '@/lib/client-events'
import { getCurrentPositionRobust, isPermissionDenied } from '@/lib/geolocation'

type Status = 'idle' | 'locating' | 'denied' | 'error'

const PRIMARY_BUTTON =
  'rounded-lg bg-accent px-12 py-4 text-base font-bold text-white transition-transform duration-150 active:scale-[0.98]'

const SECONDARY_BUTTON =
  'rounded-lg border border-stone-300 bg-white px-8 py-3 text-sm font-medium text-ink transition-transform duration-150 active:scale-[0.98]'

export function HereClient({ source }: { source?: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const router = useRouter()
  const t = useTranslations('here')
  const tErrors = useTranslations('errors')

  const locate = async () => {
    setStatus('locating')

    let position: GeolocationPosition
    try {
      position = await getCurrentPositionRobust()
    } catch (error) {
      if (isPermissionDenied(error)) {
        setStatus('denied')
        sendClientEvent({ type: 'geo_denied', source })
      } else {
        setStatus('error')
        const err = error as GeolocationPositionError
        sendClientEvent({
          type: 'geo_error',
          source,
          meta: { code: err?.code ?? null, message: err?.message ?? String(error) },
        })
      }
      return
    }

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
  }

  if (status === 'locating') {
    return <p className="text-sm text-stone-600">{t('locating')}</p>
  }

  if (status === 'denied') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-stone-700">{t('denied')}</p>
        <p className="text-xs text-stone-500">{t('deniedHint')}</p>
        <button onClick={locate} className={SECONDARY_BUTTON}>
          {t('retry')}
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-stone-700">{tErrors('generic')}</p>
        <button onClick={locate} className={SECONDARY_BUTTON}>
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
