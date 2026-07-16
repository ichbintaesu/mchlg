'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MAX_POST_LENGTH } from '@/config'
import { sendClientEvent } from '@/lib/client-events'
import { getCurrentPositionRobust } from '@/lib/geolocation'

type SubmitState = 'idle' | 'submitting' | 'posted' | 'pending'

export function ComposeSheet({ cellId, source }: { cellId: string; source?: string }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [state, setState] = useState<SubmitState>('idle')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const t = useTranslations('cell')
  const tErrors = useTranslations('errors')

  const handleOpen = () => {
    setOpen(true)
    sendClientEvent({ type: 'compose_opened', cellId, source })
  }

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    setState('submitting')
    setError(null)

    let position: GeolocationPosition
    try {
      position = await getCurrentPositionRobust()
    } catch {
      setState('idle')
      setError(tErrors('generic'))
      return
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cellId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          content: trimmed,
          source,
        }),
      })
      const data: { status?: string; error?: string } = await res.json()
      if (!res.ok) {
        setState('idle')
        setError(mapError(data.error))
        return
      }
      if (data.status === 'pending') {
        setState('pending')
      } else {
        setState('posted')
        router.refresh()
      }
      setContent('')
      setOpen(false)
    } catch {
      setState('idle')
      setError(tErrors('generic'))
    }
  }

  const mapError = (code: string | undefined): string => {
    switch (code) {
      case 'cell_mismatch':
        return tErrors('cellMismatch')
      case 'rate_limited':
      case 'device_blocked':
        return tErrors('rateLimited')
      case 'filter_blocked':
        return tErrors('filterBlocked')
      case 'low_accuracy':
        return tErrors('lowAccuracy')
      case 'too_long':
        return tErrors('tooLong')
      default:
        return tErrors('generic')
    }
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleOpen}
          className="w-full rounded-lg border border-stone-300 bg-white py-3.5 font-bold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-transform duration-150 active:scale-[0.98]"
        >
          {t('compose')}
        </button>
        {state === 'posted' && <p className="text-center text-xs text-stone-500">{t('posted')}</p>}
        {state === 'pending' && (
          <p className="text-center text-xs text-stone-500">{t('pendingNotice')}</p>
        )}
        {error && <p className="text-center text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2.5 rounded-md bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('placeholder')}
        maxLength={MAX_POST_LENGTH}
        rows={3}
        autoFocus
        className="w-full resize-none rounded-lg border border-stone-300 p-3 text-[15px] text-ink outline-none placeholder:text-stone-400 focus:border-accent"
      />
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span className={content.length >= MAX_POST_LENGTH ? 'font-semibold text-red-600' : ''}>
          {content.length}/{MAX_POST_LENGTH}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-stone-500">{t('guideline')}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={state === 'submitting' || content.trim().length === 0}
          className="flex-1 rounded-lg border border-stone-300 bg-white py-3 text-sm font-bold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
        >
          {t('submit')}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg px-5 py-3 text-sm text-stone-500"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
