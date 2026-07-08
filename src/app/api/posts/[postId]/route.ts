import { NextResponse, type NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { getRequestContext } from '@/lib/request-context'
import { trackEvent } from '@/lib/events'
import { incrementCellVisibleCount } from '@/lib/cells'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  const ctx = await getRequestContext()
  if (!ctx.deviceHash) return NextResponse.json({ error: 'no_device' }, { status: 400 })

  const [post] = await db.select().from(posts).where(eq(posts.id, postId))
  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (post.deviceHash !== ctx.deviceHash) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (post.status === 'deleted') return NextResponse.json({ ok: true })

  const wasVisible = post.status === 'visible'
  await db
    .update(posts)
    .set({ status: 'deleted', updatedAt: new Date() })
    .where(eq(posts.id, postId))

  await Promise.all([
    wasVisible ? incrementCellVisibleCount(post.cellId, -1) : Promise.resolve(),
    trackEvent({ type: 'post_deleted', ctx, cellId: post.cellId }),
  ])

  return NextResponse.json({ ok: true })
}
