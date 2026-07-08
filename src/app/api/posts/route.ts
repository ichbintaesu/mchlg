import { NextResponse, type NextRequest } from 'next/server'
import { cookies, headers } from 'next/headers'
import { nanoid } from 'nanoid'
import { db } from '@/db'
import { posts } from '@/db/schema'
import {
  IP_RETENTION_DAYS,
  LOCALE_COOKIE,
  MAX_GPS_ACCURACY_METERS,
  MAX_POST_LENGTH,
} from '@/config'
import { isValidCellId, isWithinWriteTolerance } from '@/lib/h3'
import { ensureCell, incrementCellCounts } from '@/lib/posts'
import { getRequestContext } from '@/lib/request-context'
import { trackEvent } from '@/lib/events'
import { acquireWriteSlot, checkIpWriteLimit, isDeviceBlocked } from '@/lib/ratelimit'
import { detectLanguage, moderateContent } from '@/lib/moderation'
import { encryptIp } from '@/lib/crypto'
import { matchLocale } from '@/i18n/locale'

interface CreatePostBody {
  cellId: string
  lat: number
  lng: number
  accuracy: number
  content: string
  source?: string
}

export async function POST(request: NextRequest) {
  let body: CreatePostBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const [ctx, cookieStore, headerStore] = await Promise.all([
    getRequestContext(),
    cookies(),
    headers(),
  ])
  const locale = matchLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get('accept-language'),
  )
  const source = typeof body.source === 'string' ? body.source.slice(0, 32) : undefined

  const reject = async (error: string, status: number) => {
    await trackEvent({
      type: 'post_rejected',
      ctx,
      uiLocale: locale,
      cellId: typeof body.cellId === 'string' ? body.cellId : undefined,
      source,
      meta: { reason: error },
    })
    return NextResponse.json({ error }, { status })
  }

  if (!ctx.deviceHash) return reject('no_device', 400)

  const { cellId, lat, lng, accuracy, content } = body
  if (typeof cellId !== 'string' || !isValidCellId(cellId)) return reject('invalid_cell', 400)
  if (typeof lat !== 'number' || typeof lng !== 'number') return reject('invalid_coords', 400)
  if (typeof content !== 'string' || content.trim().length === 0) return reject('empty', 400)

  const trimmed = content.trim()
  if (trimmed.length > MAX_POST_LENGTH) return reject('too_long', 400)

  if (typeof accuracy !== 'number' || accuracy > MAX_GPS_ACCURACY_METERS) {
    return reject('low_accuracy', 400)
  }

  if (!isWithinWriteTolerance(cellId, lat, lng)) return reject('cell_mismatch', 400)

  const cell = await ensureCell(cellId)
  if (cell.status !== 'active') return reject('cell_locked', 403)

  if (await isDeviceBlocked(ctx.deviceHash)) return reject('device_blocked', 403)
  if (!(await checkIpWriteLimit(ctx.ipHash))) return reject('rate_limited', 429)

  const moderation = moderateContent(trimmed)
  if (moderation.verdict === 'blocked') return reject('filter_blocked', 400)

  if (!(await acquireWriteSlot(ctx.deviceHash))) return reject('rate_limited', 429)

  const status = cell.sensitive || moderation.verdict === 'pending' ? 'pending' : 'visible'

  const postId = nanoid()
  await db.insert(posts).values({
    id: postId,
    cellId,
    content: trimmed,
    language: detectLanguage(trimmed),
    status,
    deviceHash: ctx.deviceHash,
    ipHash: ctx.ipHash,
    ipEnc: ctx.ip ? encryptIp(ctx.ip) : null,
    ipEncExpiresAt: new Date(Date.now() + IP_RETENTION_DAYS * 24 * 60 * 60 * 1000),
    moderationScore: moderation.matched.length,
  })

  await Promise.all([
    incrementCellCounts(cellId, status === 'visible' ? 1 : 0),
    trackEvent({
      type: 'post_created',
      ctx,
      uiLocale: locale,
      cellId,
      source,
      meta: { accuracy: Math.round(accuracy), length: trimmed.length, status },
    }),
  ])

  return NextResponse.json({ id: postId, status })
}
