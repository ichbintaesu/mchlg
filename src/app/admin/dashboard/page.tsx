import { redirect } from 'next/navigation'
import { and, desc, eq, gte, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { cells, events, posts, reports } from '@/db/schema'
import { isAdminAuthenticated } from '@/lib/admin-auth'

function jstDayStart(): Date {
  const jst = new Date(Date.now() + 9 * 3600_000)
  jst.setUTCHours(0, 0, 0, 0)
  return new Date(jst.getTime() - 9 * 3600_000)
}

const FUNNEL_STEPS = [
  { type: 'scan', label: '스캔' },
  { type: 'geo_granted', label: '위치 허용' },
  { type: 'cell_view', label: '셀 페이지 도달' },
  { type: 'compose_opened', label: '작성창 열기' },
  { type: 'post_created', label: '작성 완료' },
]

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin')

  const dayStart = jstDayStart()
  const weekStart = new Date(Date.now() - 7 * 24 * 3600_000)
  const count = sql<number>`count(*)::int`

  const [
    [today],
    funnelRows,
    rejectionRows,
    statusRows,
    [openReports],
    [pendingPosts],
    recentCells,
  ] = await Promise.all([
    db
      .select({
        scans: sql<number>`count(*) filter (where ${events.eventType} = 'scan')::int`,
        posts: sql<number>`count(*) filter (where ${events.eventType} = 'post_created')::int`,
        reports: sql<number>`count(*) filter (where ${events.eventType} = 'report_created')::int`,
        devices: sql<number>`count(distinct ${events.deviceHash})::int`,
      })
      .from(events)
      .where(gte(events.createdAt, dayStart)),
    db
      .select({ type: events.eventType, c: count })
      .from(events)
      .where(gte(events.createdAt, weekStart))
      .groupBy(events.eventType),
    db
      .select({ reason: sql<string>`${events.meta}->>'reason'`, c: count })
      .from(events)
      .where(and(eq(events.eventType, 'post_rejected'), gte(events.createdAt, weekStart)))
      .groupBy(sql`${events.meta}->>'reason'`),
    db.select({ status: posts.status, c: count }).from(posts).groupBy(posts.status),
    db.select({ c: count }).from(reports).where(eq(reports.status, 'open')),
    db.select({ c: count }).from(posts).where(eq(posts.status, 'pending')),
    db
      .select()
      .from(cells)
      .where(isNotNull(cells.lastPostAt))
      .orderBy(desc(cells.lastPostAt))
      .limit(5),
  ])

  const funnel = new Map(funnelRows.map((r) => [r.type, r.c]))
  const statusCount = new Map(statusRows.map((r) => [r.status, r.c]))
  const needsAction = (openReports?.c ?? 0) + (pendingPosts?.c ?? 0)

  return (
    <main className="space-y-8 pb-10">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-stone-700">오늘 (JST)</h2>
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="스캔" value={today?.scans ?? 0} />
          <StatCard label="작성" value={today?.posts ?? 0} />
          <StatCard label="신고" value={today?.reports ?? 0} />
          <StatCard label="방문 기기" value={today?.devices ?? 0} />
        </div>
      </section>

      {needsAction > 0 && (
        <section className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          처리 필요: 미처리 신고 {openReports?.c ?? 0}건, pending 글 {pendingPosts?.c ?? 0}건
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-stone-700">퍼널 · 최근 7일</h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            {FUNNEL_STEPS.map((step, i) => {
              const value = funnel.get(step.type) ?? 0
              const prev = i > 0 ? (funnel.get(FUNNEL_STEPS[i - 1].type) ?? 0) : null
              const rate = prev ? Math.round((value / prev) * 100) : null
              return (
                <tr key={step.type} className="border-b border-stone-200">
                  <td className="py-2 text-stone-600">{step.label}</td>
                  <td className="py-2 text-right font-medium tabular-nums">{value}</td>
                  <td className="w-24 py-2 text-right text-stone-400 tabular-nums">
                    {rate !== null ? `${rate}%` : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <div className="grid grid-cols-2 gap-8">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-700">작성 거부 사유 · 7일</h2>
          {rejectionRows.length === 0 ? (
            <p className="text-sm text-stone-400">없음</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <tbody>
                {rejectionRows.map((r) => (
                  <tr key={r.reason} className="border-b border-stone-200">
                    <td className="py-1.5 text-stone-600">{r.reason}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-700">글 상태 · 전체</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {['visible', 'pending', 'hidden', 'deleted'].map((s) => (
                <tr key={s} className="border-b border-stone-200">
                  <td className="py-1.5 text-stone-600">{s}</td>
                  <td className="py-1.5 text-right tabular-nums">{statusCount.get(s) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-stone-700">최근 활동 셀</h2>
        {recentCells.length === 0 ? (
          <p className="text-sm text-stone-400">없음</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 text-left text-xs text-stone-500">
                <th className="py-1.5 font-medium">셀</th>
                <th className="py-1.5 text-right font-medium">글</th>
                <th className="py-1.5 text-right font-medium">visible</th>
                <th className="py-1.5 text-right font-medium">마지막 작성</th>
              </tr>
            </thead>
            <tbody>
              {recentCells.map((cell) => (
                <tr key={cell.id} className="border-b border-stone-200">
                  <td className="py-1.5">
                    <a
                      href={`/c/${cell.id}`}
                      target="_blank"
                      className="font-mono text-xs text-stone-700 underline"
                    >
                      {cell.roughName ?? cell.id}
                    </a>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{cell.postCount}</td>
                  <td className="py-1.5 text-right tabular-nums">{cell.visiblePostCount}</td>
                  <td className="py-1.5 text-right text-xs text-stone-500">
                    {cell.lastPostAt?.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-stone-200 bg-white px-3 py-2.5">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}
