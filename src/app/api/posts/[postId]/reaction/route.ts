import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, gte, inArray, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/db'
import { events, postReactions, posts } from '@/db/schema'
import { getRequestContext } from '@/lib/request-context'
import { trackEvent } from '@/lib/events'

const REACTION_WINDOW_MS = 60 * 1000
const REACTION_WINDOW_MAX = 20

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  const ctx = await getRequestContext()
  if (!ctx.deviceHash) return NextResponse.json({ error: 'no_device' }, { status: 400 })

  const [post] = await db.select().from(posts).where(eq(posts.id, postId))
  if (!post || post.status !== 'visible') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (post.deviceHash === ctx.deviceHash) {
    return NextResponse.json({ error: 'own_post' }, { status: 403 })
  }

  const windowStart = new Date(Date.now() - REACTION_WINDOW_MS)
  const [recent] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events)
    .where(
      and(
        eq(events.deviceHash, ctx.deviceHash),
        inArray(events.eventType, ['reaction_created', 'reaction_removed']),
        gte(events.createdAt, windowStart),
      ),
    )
  if ((recent?.count ?? 0) >= REACTION_WINDOW_MAX) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const inserted = await db
    .insert(postReactions)
    .values({ id: nanoid(), postId, deviceHash: ctx.deviceHash })
    .onConflictDoNothing()
    .returning({ id: postReactions.id })

  let reacted: boolean
  if (inserted.length > 0) {
    reacted = true
    await db
      .update(posts)
      .set({ reactionCount: sql`${posts.reactionCount} + 1` })
      .where(eq(posts.id, postId))
    await trackEvent({ type: 'reaction_created', ctx, cellId: post.cellId })
  } else {
    reacted = false
    const deleted = await db
      .delete(postReactions)
      .where(and(eq(postReactions.postId, postId), eq(postReactions.deviceHash, ctx.deviceHash)))
      .returning({ id: postReactions.id })
    if (deleted.length > 0) {
      await db
        .update(posts)
        .set({ reactionCount: sql`greatest(${posts.reactionCount} - 1, 0)` })
        .where(eq(posts.id, postId))
      await trackEvent({ type: 'reaction_removed', ctx, cellId: post.cellId })
    }
  }

  const [updated] = await db
    .select({ reactionCount: posts.reactionCount })
    .from(posts)
    .where(eq(posts.id, postId))

  return NextResponse.json({ reacted, count: updated?.reactionCount ?? 0 })
}
