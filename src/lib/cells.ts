import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { cells } from '@/db/schema'

export async function incrementCellVisibleCount(cellId: string, delta: number): Promise<void> {
  await db
    .update(cells)
    .set({ visiblePostCount: sql`greatest(${cells.visiblePostCount} + ${delta}, 0)` })
    .where(eq(cells.id, cellId))
}
