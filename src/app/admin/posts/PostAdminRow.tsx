'use client'

import { useTransition } from 'react'
import { setPostStatusAction } from '../actions'

interface PostAdminRowProps {
  id: string
  content: string
  status: string
  cellId: string
  language: string | null
  reportCount: number
  deviceHash: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  visible: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  hidden: 'bg-stone-200 text-stone-600',
  deleted: 'bg-red-100 text-red-800',
}

export function PostAdminRow({
  id,
  content,
  status,
  cellId,
  language,
  reportCount,
  deviceHash,
  createdAt,
}: PostAdminRowProps) {
  const [isPending, startTransition] = useTransition()

  const act = (next: 'visible' | 'hidden' | 'deleted' | 'pending') => {
    startTransition(async () => {
      await setPostStatusAction(id, next)
    })
  }

  return (
    <li className={`rounded-xl bg-white p-4 text-ink ${isPending ? 'opacity-50' : ''}`}>
      <p className="break-words text-sm">{content}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className={`rounded-full px-2 py-0.5 ${STATUS_COLORS[status] ?? 'bg-stone-100'}`}>
          {status}
        </span>
        {reportCount > 0 && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600">신고 {reportCount}</span>
        )}
        <span>{language ?? '-'}</span>
        <span>{deviceHash}</span>
        <span>{new Date(createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <a href={`/c/${cellId}`} target="_blank" className="text-stone-400 underline">
          셀 보기
        </a>
        {status !== 'visible' && (
          <button onClick={() => act('visible')} className="text-green-700 underline">
            복구
          </button>
        )}
        {status !== 'hidden' && (
          <button onClick={() => act('hidden')} className="text-stone-600 underline">
            숨김
          </button>
        )}
        {status !== 'pending' && (
          <button onClick={() => act('pending')} className="text-yellow-700 underline">
            보류
          </button>
        )}
        {status !== 'deleted' && (
          <button onClick={() => act('deleted')} className="text-red-600 underline">
            삭제
          </button>
        )}
      </div>
    </li>
  )
}
