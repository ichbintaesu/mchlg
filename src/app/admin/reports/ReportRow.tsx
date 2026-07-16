'use client'

import { useTransition } from 'react'
import { resolveReportAction } from '../actions'

interface ReportRowProps {
  id: string
  reason: string
  detail: string | null
  status: string
  createdAt: string
  postContent: string
  postStatus: string
  postReportCount: number
  cellId: string | null
}

export function ReportRow({
  id,
  reason,
  detail,
  status,
  createdAt,
  postContent,
  postStatus,
  postReportCount,
  cellId,
}: ReportRowProps) {
  const [isPending, startTransition] = useTransition()

  const resolve = (resolution: 'dismissed' | 'actioned') => {
    startTransition(async () => {
      await resolveReportAction(id, resolution)
    })
  }

  return (
    <li className={`rounded-md border border-stone-200 bg-white p-3 ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words text-sm text-ink">{postContent}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700">{reason}</span>
            {detail && <span className="text-stone-600">“{detail}”</span>}
            <span>글 상태: {postStatus}</span>
            <span>누적 신고 {postReportCount}</span>
            <span>{new Date(createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
            {cellId && (
              <a href={`/c/${cellId}`} target="_blank" className="underline">
                셀 보기
              </a>
            )}
          </div>
        </div>
        {status === 'open' && (
          <div className="flex shrink-0 gap-1.5 text-xs">
            <button
              onClick={() => resolve('actioned')}
              className="rounded-md border border-red-300 px-2.5 py-1.5 text-red-700"
            >
              글 숨김
            </button>
            <button
              onClick={() => resolve('dismissed')}
              className="rounded-md border border-stone-300 px-2.5 py-1.5 text-stone-600"
            >
              기각
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
