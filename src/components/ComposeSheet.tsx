'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MAX_POST_LENGTH } from '@/config'
import { sendClientEvent } from '@/lib/client-events'

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

  const handleSubmit = () => {
    const trimmed = content.trim()
    if (!trimmed) return
    setState('submitting')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
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
      },
      () => {
        setState('idle')
        setError(tErrors('generic'))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
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
          className="w-full rounded-full bg-stone-900 py-3 font-medium text-stone-50"
        >
          {t('compose')}
        </button>
        {state === 'posted' && <p className="text-center text-xs text-stone-500">{t('posted')}</p>}
        {state === 'pending' && (
          <p className="text-center text-xs text-stone-500">{t('pendingNotice')}</p>
        )}
        {error && <p className="text-center text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('placeholder')}
        maxLength={MAX_POST_LENGTH}
        rows={3}
        autoFocus
        className="w-full resize-none rounded border border-stone-300 p-2 text-sm"
      />
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>
          {content.length}/{MAX_POST_LENGTH}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-stone-400">{t('guideline')}</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={state === 'submitting' || content.trim().length === 0}
          className="flex-1 rounded-full bg-stone-900 py-2.5 text-sm font-medium text-stone-50 disabled:opacity-40"
        >
          {t('submit')}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full border border-stone-300 px-4 py-2.5 text-sm"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
