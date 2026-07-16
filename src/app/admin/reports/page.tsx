import Link from 'next/link'
import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { posts, reports } from '@/db/schema'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { ReportRow } from './ReportRow'

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  if (!(await isAdminAuthenticated())) redirect('/admin')

  const { filter = 'open' } = await searchParams

  const rows = await db
    .select({ report: reports, post: posts })
    .from(reports)
    .leftJoin(posts, eq(reports.postId, posts.id))
    .where(filter === 'all' ? undefined : eq(reports.status, filter))
    .orderBy(desc(reports.createdAt))
    .limit(100)

  return (
    <main className="pb-10">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-base font-bold">신고 관리</h1>
        <nav className="flex gap-1 text-xs">
          {['open', 'dismissed', 'actioned', 'all'].map((f) => (
            <Link
              key={f}
              href={`/admin/reports?filter=${f}`}
              className={`rounded-md border px-2.5 py-1 ${
                filter === f
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 text-stone-600'
              }`}
            >
              {f === 'open' ? '미처리' : f === 'dismissed' ? '기각됨' : f === 'actioned' ? '조치됨' : '전체'}
            </Link>
          ))}
        </nav>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">신고가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ report, post }) => (
            <ReportRow
              key={report.id}
              id={report.id}
              reason={report.reason}
              detail={report.detail}
              status={report.status}
              createdAt={report.createdAt.toISOString()}
              postContent={post?.content ?? '(삭제된 글)'}
              postStatus={post?.status ?? '-'}
              postReportCount={post?.reportCount ?? 0}
              cellId={post?.cellId ?? null}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
