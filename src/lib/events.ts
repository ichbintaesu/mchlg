import { nanoid } from 'nanoid'
import { db } from '@/db'
import { events } from '@/db/schema'
import { parseUserAgent } from './ua'
import type { RequestContext } from './request-context'

export type EventType =
  | 'scan'
  | 'geo_granted'
  | 'geo_denied'
  | 'geo_error'
  | 'cell_view'
  | 'compose_opened'
  | 'post_created'
  | 'post_rejected'
  | 'post_deleted'
  | 'report_created'
  | 'reaction_created'
  | 'reaction_removed'

export const EVENT_TYPES: EventType[] = [
  'scan',
  'geo_granted',
  'geo_denied',
  'geo_error',
  'cell_view',
  'compose_opened',
  'post_created',
  'post_rejected',
  'post_deleted',
  'report_created',
  'reaction_created',
  'reaction_removed',
]

interface TrackInput {
  type: EventType
  ctx: RequestContext
  uiLocale?: string
  cellId?: string
  source?: string
  meta?: Record<string, unknown>
}

export async function trackEvent({ type, ctx, uiLocale, cellId, source, meta }: TrackInput): Promise<void> {
  const ua = parseUserAgent(ctx.userAgent)
  try {
    await db.insert(events).values({
      id: nanoid(),
      eventType: type,
      cellId: cellId ?? null,
      deviceHash: ctx.deviceHash,
      source: source ?? null,
      uiLocale: uiLocale ?? null,
      deviceLanguage: ctx.deviceLanguage,
      os: ua.os,
      browser: ua.browser,
      deviceType: ua.deviceType,
      country: ctx.country,
      meta: meta ?? null,
    })
  } catch (error) {
    console.error('trackEvent failed', type, error)
  }
}
