import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import { cells, posts } from '@/db/schema'
import { NEIGHBOR_FILL_THRESHOLD, POSTS_PAGE_SIZE } from '@/config'
import { cellCenter, neighborCells } from './h3'

export interface CellPost {
  id: string
  content: string
  createdAt: Date
  deviceHash: string | null
  isNeighbor: boolean
}

export async function ensureCell(cellId: string) {
  const center = cellCenter(cellId)
  await db
    .insert(cells)
    .values({ id: cellId, centerLat: center.lat, centerLng: center.lng })
    .onConflictDoNothing()
  const [cell] = await db.select().from(cells).where(eq(cells.id, cellId))
  return cell
}

export async function getCell(cellId: string) {
  const [cell] = await db.select().from(cells).where(eq(cells.id, cellId))
  return cell ?? null
}

export async function listCellPosts(cellId: string): Promise<{ posts: CellPost[]; neighborFill: boolean }> {
  const own = await db
    .select()
    .from(posts)
    .where(and(eq(posts.cellId, cellId), eq(posts.status, 'visible')))
    .orderBy(desc(posts.createdAt))
    .limit(POSTS_PAGE_SIZE)

  const ownPosts: CellPost[] = own.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt,
    deviceHash: p.deviceHash,
    isNeighbor: false,
  }))

  if (ownPosts.length >= NEIGHBOR_FILL_THRESHOLD) {
    return { posts: ownPosts, neighborFill: false }
  }

  const neighbors = neighborCells(cellId).filter((id) => id !== cellId)
  const neighborRows = await db
    .select()
    .from(posts)
    .where(and(inArray(posts.cellId, neighbors), eq(posts.status, 'visible')))
    .orderBy(desc(posts.createdAt))
    .limit(POSTS_PAGE_SIZE - ownPosts.length)

  const neighborPosts: CellPost[] = neighborRows.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt,
    deviceHash: p.deviceHash,
    isNeighbor: true,
  }))

  return {
    posts: [...ownPosts, ...neighborPosts].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    ),
    neighborFill: neighborPosts.length > 0,
  }
}

export async function incrementCellCounts(cellId: string, visibleDelta: number) {
  await db
    .update(cells)
    .set({
      postCount: sql`${cells.postCount} + 1`,
      visiblePostCount: sql`${cells.visiblePostCount} + ${visibleDelta}`,
      lastPostAt: new Date(),
    })
    .where(eq(cells.id, cellId))
}
