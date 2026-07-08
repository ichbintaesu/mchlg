import Link from 'next/link'
import { redirect } from 'next/navigation'
import { desc, eq, gt } from 'drizzle-orm'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { logoutAction } from '../actions'
import { PostAdminRow } from './PostAdminRow'

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'visible', label: 'visible' },
  { key: 'pending', label: 'pending' },
  { key: 'hidden', label: 'hidden' },
  { key: 'deleted', label: 'deleted' },
  { key: 'reported', label: '신고됨' },
] as const

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  if (!(await isAdminAuthenticated())) redirect('/admin')

  const { filter = 'all' } = await searchParams

  const baseQuery = db.select().from(posts)
  const rows =
    filter === 'reported'
      ? await baseQuery.where(gt(posts.reportCount, 0)).orderBy(desc(posts.createdAt)).limit(100)
      : filter === 'all'
        ? await baseQuery.orderBy(desc(posts.createdAt)).limit(100)
        : await baseQuery.where(eq(posts.status, filter)).orderBy(desc(posts.createdAt)).limit(100)

  return (
    <main className="flex flex-1 flex-col py-6">
      <header className="flex items-center justify-between pb-4">
        <h1 className="text-lg font-bold">글 관리</h1>
        <form action={logoutAction}>
          <button type="submit" className="text-xs text-stone-500 underline">
            로그아웃
          </button>
        </form>
      </header>

      <nav className="flex flex-wrap gap-2 pb-4 text-xs">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/posts?filter=${f.key}`}
            className={`rounded-full border px-3 py-1 ${
              filter === f.key
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-300 text-stone-600'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">글이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((post) => (
            <PostAdminRow
              key={post.id}
              id={post.id}
              content={post.content}
              status={post.status}
              cellId={post.cellId}
              language={post.language}
              reportCount={post.reportCount}
              deviceHash={post.deviceHash?.slice(0, 8) ?? '-'}
              createdAt={post.createdAt.toISOString()}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
