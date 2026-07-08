'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'

const REPORT_REASONS = ['personal', 'abuse', 'sexual', 'hate', 'spam', 'danger', 'other'] as const

interface PostItemProps {
  id: string
  content: string
  createdAt: string
  isNeighbor: boolean
  isOwn: boolean
}

export function PostItem({ id, content, createdAt, isNeighbor, isOwn }: PostItemProps) {
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState<string>('personal')
  const [detail, setDetail] = useState('')
  const [done, setDone] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const router = useRouter()
  const t = useTranslations('cell')
  const tReasons = useTranslations('reportReasons')
  const tErrors = useTranslations('errors')
  const format = useFormatter()

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const handleReport = async () => {
    setReportError(null)
    try {
      const res = await fetch(`/api/posts/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, detail: detail || undefined }),
      })
      if (res.ok || res.status === 409) {
        setReporting(false)
        setDone(true)
      } else if (res.status === 429) {
        setReportError(tErrors('rateLimited'))
      } else {
        setReportError(tErrors('generic'))
      }
    } catch {
      setReportError(tErrors('generic'))
    }
  }

  return (
    <li className="glass rounded-2xl p-4">
      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">{content}</p>
      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-stone-400">
        <time>{format.dateTime(new Date(createdAt), { dateStyle: 'medium', timeStyle: 'short' })}</time>
        {isNeighbor && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 font-medium text-accent-deep">
            {t('neighborLabel')}
          </span>
        )}
        <span className="ml-auto flex gap-3">
          {isOwn && (
            <button onClick={handleDelete} className="text-stone-400">
              {t('delete')}
            </button>
          )}
          {done ? (
            <span>{t('reported')}</span>
          ) : (
            <button onClick={() => setReporting(!reporting)} className="text-stone-400">
              {t('report')}
            </button>
          )}
        </span>
      </div>

      {reporting && (
        <div className="mt-3 space-y-2 border-t border-stone-900/10 pt-3">
          <p className="text-xs font-semibold text-stone-600">{t('reportTitle')}</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl bg-stone-900/5 px-3 py-2 text-sm text-ink outline-none"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {tReasons(r)}
              </option>
            ))}
          </select>
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={t('reportDetail')}
            maxLength={200}
            className="w-full rounded-xl bg-stone-900/5 px-3 py-2 text-sm text-ink outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-accent/40"
          />
          {reportError && <p className="text-xs text-accent-deep">{reportError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleReport}
              className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-white transition-transform duration-150 active:scale-95"
            >
              {t('reportSubmit')}
            </button>
            <button
              onClick={() => setReporting(false)}
              className="rounded-full px-4 py-2 text-xs text-stone-500"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
