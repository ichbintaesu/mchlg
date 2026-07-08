import { and, eq, gte, isNull, lt, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { devices, posts, reports } from '@/db/schema'
import { REPORT_LIMIT_PER_DEVICE, WRITE_LIMIT_PER_DEVICE_MS, WRITE_LIMIT_PER_IP } from '@/config'

export async function isDeviceBlocked(deviceHash: string): Promise<boolean> {
  const [device] = await db.select().from(devices).where(eq(devices.deviceHash, deviceHash))
  return Boolean(device?.blockedUntil && device.blockedUntil.getTime() > Date.now())
}

export async function checkIpWriteLimit(ipHash: string | null): Promise<boolean> {
  if (!ipHash) return true
  const windowStart = new Date(Date.now() - WRITE_LIMIT_PER_IP.windowMs)
  const [recent] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.ipHash, ipHash), gte(posts.createdAt, windowStart)))
  return (recent?.count ?? 0) < WRITE_LIMIT_PER_IP.max
}

export async function acquireWriteSlot(deviceHash: string): Promise<boolean> {
  await db
    .insert(devices)
    .values({ id: deviceHash, deviceHash })
    .onConflictDoNothing()

  const cooldownStart = new Date(Date.now() - WRITE_LIMIT_PER_DEVICE_MS)
  const acquired = await db
    .update(devices)
    .set({ lastPostAt: new Date(), lastSeenAt: new Date() })
    .where(
      and(
        eq(devices.deviceHash, deviceHash),
        or(isNull(devices.lastPostAt), lt(devices.lastPostAt, cooldownStart)),
      ),
    )
    .returning({ id: devices.id })

  return acquired.length > 0
}

export async function checkReportWindow(deviceHash: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - REPORT_LIMIT_PER_DEVICE.windowMs)
  const [recent] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reports)
    .where(and(eq(reports.deviceHash, deviceHash), gte(reports.createdAt, windowStart)))
  return (recent?.count ?? 0) < REPORT_LIMIT_PER_DEVICE.max
}
