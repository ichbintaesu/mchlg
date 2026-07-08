import { NextResponse, type NextRequest } from 'next/server'
import { and, isNotNull, lt } from 'drizzle-orm'
import { db } from '@/db'
import { posts } from '@/db/schema'

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'not_configured' }, { status: 500 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const result = await db
    .update(posts)
    .set({ ipEnc: null })
    .where(and(isNotNull(posts.ipEnc), lt(posts.ipEncExpiresAt, new Date())))
    .returning({ id: posts.id })

  return NextResponse.json({ purged: result.length })
}
