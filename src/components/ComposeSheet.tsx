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
          className="glossy w-full rounded-full bg-ink py-3.5 font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
        >
          {t('compose')}
        </button>
        {state === 'posted' && <p className="text-center text-xs text-stone-500">{t('posted')}</p>}
        {state === 'pending' && (
          <p className="text-center text-xs text-stone-500">{t('pendingNotice')}</p>
        )}
        {error && <p className="text-center text-xs text-accent-deep">{error}</p>}
      </div>
    )
  }

  return (
    <div className="glass-strong space-y-2.5 rounded-2xl p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('placeholder')}
        maxLength={MAX_POST_LENGTH}
        rows={3}
        autoFocus
        className="w-full resize-none rounded-xl bg-stone-900/5 p-3 text-[15px] text-ink outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-accent/40"
      />
      <div className="flex items-center justify-between text-[11px] text-stone-400">
        <span className={content.length >= MAX_POST_LENGTH ? 'font-semibold text-accent-deep' : ''}>
          {content.length}/{MAX_POST_LENGTH}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-stone-400">{t('guideline')}</p>
      {error && <p className="text-xs text-accent-deep">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={state === 'submitting' || content.trim().length === 0}
          className="glossy flex-1 rounded-full bg-ink py-3 text-sm font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
        >
          {t('submit')}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full px-5 py-3 text-sm text-stone-500"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
