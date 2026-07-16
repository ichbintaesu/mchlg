'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'

const REPORT_REASONS = ['personal', 'abuse', 'sexual', 'hate', 'spam', 'danger', 'other'] as const

interface PostItemProps {
  id: string
  content: string
  createdAt: string
  isOwn: boolean
  reactionCount: number
  reactedByMe: boolean
}

export function PostItem({
  id,
  content,
  createdAt,
  isOwn,
  reactionCount,
  reactedByMe,
}: PostItemProps) {
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState<string>('personal')
  const [detail, setDetail] = useState('')
  const [done, setDone] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reacted, setReacted] = useState(reactedByMe)
  const [count, setCount] = useState(reactionCount)
  const [reactionBusy, setReactionBusy] = useState(false)
  const router = useRouter()
  const t = useTranslations('cell')
  const tReasons = useTranslations('reportReasons')
  const tErrors = useTranslations('errors')
  const format = useFormatter()

  const created = new Date(createdAt)

  const handleReaction = async () => {
    if (isOwn || reactionBusy) return
    setReactionBusy(true)
    setReacted(!reacted)
    setCount((c) => c + (reacted ? -1 : 1))
    try {
      const res = await fetch(`/api/posts/${id}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      if (res.ok) {
        const data: { reacted: boolean; count: number } = await res.json()
        setReacted(data.reacted)
        setCount(data.count)
      } else {
        setReacted(reacted)
        setCount(count)
      }
    } catch {
      setReacted(reacted)
      setCount(count)
    } finally {
      setReactionBusy(false)
    }
  }

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
    <li className="px-4 py-3.5">
      <div className="flex gap-3">
        <time className="shrink-0 pt-0.5 text-right font-mono text-xs font-semibold leading-5 tabular-nums text-accent-deep">
          {format.dateTime(created, { hour: '2-digit', minute: '2-digit', hour12: false })}
          <span className="block text-[10px] font-normal text-stone-400">
            {format.dateTime(created, { month: 'numeric', day: 'numeric' })}
          </span>
        </time>
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
            {content}
          </p>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-stone-500">
            {isOwn ? (
              count > 0 && (
                <span className="font-medium text-accent-deep">
                  {t('reaction')} {count}
                </span>
              )
            ) : (
              <button
                onClick={handleReaction}
                className={`rounded-full border px-2.5 py-0.5 font-medium transition-colors ${
                  reacted
                    ? 'border-accent bg-accent/10 text-accent-deep'
                    : 'border-stone-300 text-stone-500'
                }`}
              >
                {t('reaction')}
                {count > 0 && <span className="ml-1 tabular-nums">{count}</span>}
              </button>
            )}
            <span className="ml-auto flex gap-3">
            {isOwn && (
              <button onClick={handleDelete} className="underline">
                {t('delete')}
              </button>
            )}
            {done ? (
              <span>{t('reported')}</span>
            ) : (
              <button onClick={() => setReporting(!reporting)} className="underline">
                {t('report')}
              </button>
            )}
            </span>
          </div>
        </div>
      </div>

      {reporting && (
        <div className="mt-3 space-y-2 border-t border-stone-200 pt-3">
          <p className="text-xs font-semibold text-stone-600">{t('reportTitle')}</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
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
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-stone-400 focus:border-accent"
          />
          {reportError && <p className="text-xs text-red-600">{reportError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleReport}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-transform duration-150 active:scale-95"
            >
              {t('reportSubmit')}
            </button>
            <button
              onClick={() => setReporting(false)}
              className="rounded-lg px-4 py-2 text-xs text-stone-500"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
