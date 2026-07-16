import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { cells, posts } from '@/db/schema'
import { POSTS_PAGE_SIZE } from '@/config'
import { cellCenter, directionalNeighbor } from './h3'
import { reverseGeocodeTown } from './geocode'

export interface CellPost {
  id: string
  content: string
  createdAt: Date
  deviceHash: string | null
}

export async function ensureCell(cellId: string) {
  const [existing] = await db.select().from(cells).where(eq(cells.id, cellId))
  const center = cellCenter(cellId)

  if (existing) {
    if (existing.roughName) return existing
    const roughName = await reverseGeocodeTown(
      existing.centerLat ?? center.lat,
      existing.centerLng ?? center.lng,
    )
    if (!roughName) return existing
    const [updated] = await db
      .update(cells)
      .set({ roughName })
      .where(eq(cells.id, cellId))
      .returning()
    return updated
  }

  const roughName = await reverseGeocodeTown(center.lat, center.lng)
  await db
    .insert(cells)
    .values({ id: cellId, centerLat: center.lat, centerLng: center.lng, roughName })
    .onConflictDoNothing()
  const [cell] = await db.select().from(cells).where(eq(cells.id, cellId))
  return cell
}

const ADJACENT_TOWN_MAX_STEPS = 4

export async function findAdjacentTown(
  cellId: string,
  dir: 'west' | 'east',
  excludeTown: string | null,
): Promise<string | null> {
  for (let k = 1; k <= ADJACENT_TOWN_MAX_STEPS; k++) {
    const neighborId = directionalNeighbor(cellId, k, dir)
    const neighbor = await ensureCell(neighborId)
    if (neighbor?.roughName && neighbor.roughName !== excludeTown) {
      return neighbor.roughName
    }
  }
  return null
}

export async function getCell(cellId: string) {
  const [cell] = await db.select().from(cells).where(eq(cells.id, cellId))
  return cell ?? null
}

export async function listCellPosts(cellId: string): Promise<CellPost[]> {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.cellId, cellId), eq(posts.status, 'visible')))
    .orderBy(desc(posts.createdAt))
    .limit(POSTS_PAGE_SIZE)

  return rows.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt,
    deviceHash: p.deviceHash,
  }))
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
