'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/db'
import { adminActions, posts } from '@/db/schema'
import { ADMIN_COOKIE, ADMIN_SESSION_HOURS } from '@/config'
import { safeEqual, signAdminSession } from '@/lib/crypto'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { incrementCellVisibleCount } from '@/lib/cells'

export async function loginAction(formData: FormData) {
  const password = formData.get('password')
  const expected = process.env.ADMIN_PASSWORD
  if (typeof password !== 'string' || !expected || !safeEqual(password, expected)) {
    redirect('/admin?error=1')
  }

  const expiresAt = Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, signAdminSession(expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_HOURS * 60 * 60,
    path: '/',
  })
  redirect('/admin/posts')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  redirect('/admin')
}

const ALLOWED_TRANSITIONS = ['visible', 'hidden', 'deleted', 'pending'] as const
type PostStatus = (typeof ALLOWED_TRANSITIONS)[number]

export async function setPostStatusAction(postId: string, status: PostStatus) {
  if (!(await isAdminAuthenticated())) redirect('/admin')
  if (!ALLOWED_TRANSITIONS.includes(status)) return

  const [post] = await db.select().from(posts).where(eq(posts.id, postId))
  if (!post || post.status === status) return

  await db.update(posts).set({ status, updatedAt: new Date() }).where(eq(posts.id, postId))

  const visibleDelta = (status === 'visible' ? 1 : 0) - (post.status === 'visible' ? 1 : 0)
  if (visibleDelta !== 0) {
    await incrementCellVisibleCount(post.cellId, visibleDelta)
  }

  await db.insert(adminActions).values({
    id: nanoid(),
    adminId: 'admin',
    actionType: `post_${status}`,
    targetType: 'post',
    targetId: postId,
  })

  revalidatePath('/admin/posts')
}
