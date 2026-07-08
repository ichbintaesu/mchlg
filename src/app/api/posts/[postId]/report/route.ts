import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/db'
import { posts, reports } from '@/db/schema'
import { AUTO_HIDE_REPORT_COUNT } from '@/config'
import { getRequestContext } from '@/lib/request-context'
import { trackEvent } from '@/lib/events'
import { checkReportWindow } from '@/lib/ratelimit'
import { incrementCellVisibleCount } from '@/lib/cells'

const VALID_REASONS = ['personal', 'abuse', 'sexual', 'hate', 'spam', 'danger', 'other']

interface ReportBody {
  reason: string
  detail?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params

  let body: ReportBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (typeof body.reason !== 'string' || !VALID_REASONS.includes(body.reason)) {
    return NextResponse.json({ error: 'invalid_reason' }, { status: 400 })
  }

  const ctx = await getRequestContext()
  if (!ctx.deviceHash) return NextResponse.json({ error: 'no_device' }, { status: 400 })

  const [post] = await db.select().from(posts).where(eq(posts.id, postId))
  if (!post || post.status === 'deleted') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (!(await checkReportWindow(ctx.deviceHash))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const inserted = await db
    .insert(reports)
    .values({
      id: nanoid(),
      postId,
      reason: body.reason,
      detail: typeof body.detail === 'string' ? body.detail.slice(0, 200) : null,
      deviceHash: ctx.deviceHash,
      ipHash: ctx.ipHash,
    })
    .onConflictDoNothing()
    .returning({ id: reports.id })

  if (inserted.length === 0) {
    return NextResponse.json({ error: 'already_reported' }, { status: 409 })
  }

  const [updated] = await db
    .update(posts)
    .set({ reportCount: sql`${posts.reportCount} + 1`, updatedAt: new Date() })
    .where(eq(posts.id, postId))
    .returning()

  if (updated.reportCount >= AUTO_HIDE_REPORT_COUNT) {
    const hidden = await db
      .update(posts)
      .set({ status: 'hidden', updatedAt: new Date() })
      .where(and(eq(posts.id, postId), eq(posts.status, 'visible')))
      .returning({ id: posts.id })
    if (hidden.length > 0) {
      await incrementCellVisibleCount(post.cellId, -1)
    }
  }

  await trackEvent({
    type: 'report_created',
    ctx,
    cellId: post.cellId,
    meta: { reason: body.reason },
  })

  return NextResponse.json({ ok: true })
}
