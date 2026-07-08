import { NextResponse, type NextRequest } from 'next/server'
import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE } from '@/config'
import { isValidCellId } from '@/lib/h3'
import { getRequestContext } from '@/lib/request-context'
import { trackEvent, type EventType } from '@/lib/events'
import { matchLocale } from '@/i18n/locale'

const CLIENT_EVENT_TYPES: EventType[] = ['geo_denied', 'geo_error', 'compose_opened']

interface ClientEventBody {
  type: EventType
  cellId?: string
  source?: string
  meta?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  let body: ClientEventBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!CLIENT_EVENT_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }

  const cellId =
    typeof body.cellId === 'string' && isValidCellId(body.cellId) ? body.cellId : undefined

  const [ctx, cookieStore, headerStore] = await Promise.all([
    getRequestContext(),
    cookies(),
    headers(),
  ])
  const locale = matchLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get('accept-language'),
  )

  await trackEvent({
    type: body.type,
    ctx,
    uiLocale: locale,
    cellId,
    source: typeof body.source === 'string' ? body.source.slice(0, 32) : undefined,
    meta: body.meta && typeof body.meta === 'object' ? body.meta : undefined,
  })

  return NextResponse.json({ ok: true })
}
