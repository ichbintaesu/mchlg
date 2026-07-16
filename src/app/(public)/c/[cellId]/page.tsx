import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'
import { SERVICE_NAME, TOWN_COOKIE } from '@/config'
import Link from 'next/link'
import { isValidCellId } from '@/lib/h3'
import { findAdjacentTown, getCell, listCellPosts, type PostSort } from '@/lib/posts'
import { getRequestContext } from '@/lib/request-context'
import { trackEvent } from '@/lib/events'
import { Footer } from '@/components/Footer'
import { PostItem } from '@/components/PostItem'
import { ComposeSheet } from '@/components/ComposeSheet'

function readTownCookie(raw: string | undefined): string | null {
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw).trim()
    return decoded && decoded.length <= 30 ? decoded : null
  } catch {
    return null
  }
}

export default async function CellPage({
  params,
  searchParams,
}: {
  params: Promise<{ cellId: string }>
  searchParams: Promise<{ s?: string; sort?: string }>
}) {
  const { cellId } = await params
  const { s, sort: sortParam } = await searchParams
  const source = typeof s === 'string' ? s.slice(0, 32) : undefined
  const sort: PostSort = sortParam === 'top' ? 'top' : 'new'

  if (!isValidCellId(cellId)) notFound()

  const cell = await getCell(cellId)
  if (cell && (cell.status === 'hidden' || cell.status === 'blocked')) notFound()

  const [cookieStore, ctx] = await Promise.all([cookies(), getRequestContext()])
  const town = readTownCookie(cookieStore.get(TOWN_COOKIE)?.value) ?? cell?.roughName ?? null

  const [posts, locale, t, westTown, eastTown] = await Promise.all([
    listCellPosts(cellId, sort, ctx.deviceHash),
    getLocale(),
    getTranslations('cell'),
    findAdjacentTown(cellId, 'west', town),
    findAdjacentTown(cellId, 'east', town),
  ])

  await trackEvent({
    type: 'cell_view',
    ctx,
    uiLocale: locale,
    cellId,
    source,
    meta: { visibleCount: posts.length },
  })

  const locked = cell?.status === 'locked'

  return (
    <main className="flex flex-1 flex-col">
      <header className="py-6">
        <p className="pb-2 text-xs font-bold tracking-widest text-stone-400">
          {SERVICE_NAME}
          <span className="text-accent">.</span>
        </p>
        <div className="overflow-hidden rounded-md bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
          <div className="px-4 pb-3 pt-6 text-center">
            {town ? (
              <>
                <h1 className="text-[27px] font-bold leading-tight tracking-wide text-ink">{town}</h1>
                <p className="mt-1 text-xs tracking-[0.2em] text-stone-500">{t('somewhere')}</p>
              </>
            ) : (
              <h1 className="text-xl font-bold tracking-wide text-ink">{t('title')}</h1>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 bg-accent px-2 py-2 text-[11px] font-medium text-white">
            <span className="flex min-w-0 items-center gap-1">
              {westTown && (
                <>
                  <span aria-hidden>◀</span>
                  <span className="truncate">{westTown}</span>
                </>
              )}
            </span>
            <span className="flex min-w-0 items-center gap-1 text-right">
              {eastTown && (
                <>
                  <span className="truncate">{eastTown}</span>
                  <span aria-hidden>▶</span>
                </>
              )}
            </span>
          </div>
        </div>
        <p className="pt-2 text-center text-xs text-stone-500">{t('subtitle')}</p>
      </header>

      {!locked && <ComposeSheet cellId={cellId} source={source} />}

      <section className="flex-1 py-4">
        {posts.length > 0 && (
          <nav className="flex justify-end gap-1 pb-2 text-xs">
            {(['new', 'top'] as const).map((key) => (
              <Link
                key={key}
                href={`/c/${cellId}?sort=${key}${source ? `&s=${encodeURIComponent(source)}` : ''}`}
                className={`rounded-md px-2.5 py-1 ${
                  sort === key ? 'bg-ink font-medium text-white' : 'text-stone-500'
                }`}
              >
                {key === 'new' ? t('sortNew') : t('sortTop')}
              </Link>
            ))}
          </nav>
        )}
        {posts.length === 0 ? (
          <div className="rounded-md bg-white px-4 py-16 text-center shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
            <p className="text-sm text-stone-500">{t('empty')}</p>
            <p className="mt-1.5 text-sm font-medium text-stone-700">{t('emptyCta')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-200 overflow-hidden rounded-md bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
            {posts.map((post) => (
              <PostItem
                key={post.id}
                id={post.id}
                content={post.content}
                createdAt={post.createdAt.toISOString()}
                isOwn={post.deviceHash !== null && post.deviceHash === ctx.deviceHash}
                reactionCount={post.reactionCount}
                reactedByMe={post.reactedByMe}
              />
            ))}
          </ul>
        )}
      </section>

      <Footer />
    </main>
  )
}
