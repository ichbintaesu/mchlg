import { NextResponse, type NextRequest } from 'next/server'
import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE, TOWN_COOKIE, TOWN_COOKIE_MAX_AGE } from '@/config'
import { resolveCell } from '@/lib/h3'
import { ensureCell } from '@/lib/posts'
import { reverseGeocodeTown } from '@/lib/geocode'
import { getRequestContext } from '@/lib/request-context'
import { trackEvent } from '@/lib/events'
import { matchLocale } from '@/i18n/locale'

interface ResolveBody {
  lat: number
  lng: number
  accuracy?: number
  source?: string
}

export async function POST(request: NextRequest) {
  let body: ResolveBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { lat, lng, accuracy, source } = body
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json({ error: 'invalid_coords' }, { status: 400 })
  }

  const cellId = resolveCell(lat, lng)
  const [, userTown] = await Promise.all([ensureCell(cellId), reverseGeocodeTown(lat, lng)])

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
    type: 'geo_granted',
    ctx,
    uiLocale: locale,
    cellId,
    source: typeof source === 'string' ? source.slice(0, 32) : undefined,
    meta: { accuracy: typeof accuracy === 'number' ? Math.round(accuracy) : null },
  })

  const redirectUrl = source ? `/c/${cellId}?s=${encodeURIComponent(source)}` : `/c/${cellId}`
  const response = NextResponse.json({ cellId, redirectUrl })
  if (userTown) {
    response.cookies.set(TOWN_COOKIE, encodeURIComponent(userTown), {
      maxAge: TOWN_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
    })
  } else {
    response.cookies.delete(TOWN_COOKIE)
  }
  return response
}
