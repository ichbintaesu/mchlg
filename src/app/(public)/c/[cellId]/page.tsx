import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'
import { SERVICE_NAME, TOWN_COOKIE } from '@/config'
import { isValidCellId } from '@/lib/h3'
import { getCell, listCellPosts } from '@/lib/posts'
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
  searchParams: Promise<{ s?: string }>
}) {
  const { cellId } = await params
  const { s } = await searchParams
  const source = typeof s === 'string' ? s.slice(0, 32) : undefined

  if (!isValidCellId(cellId)) notFound()

  const cell = await getCell(cellId)
  if (cell && (cell.status === 'hidden' || cell.status === 'blocked')) notFound()

  const [posts, ctx, locale, t, cookieStore] = await Promise.all([
    listCellPosts(cellId),
    getRequestContext(),
    getLocale(),
    getTranslations('cell'),
    cookies(),
  ])

  const town = readTownCookie(cookieStore.get(TOWN_COOKIE)?.value) ?? cell?.roughName
  const title = town ? t('titleWithTown', { town }) : t('title')

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
        <div className="overflow-hidden rounded-lg border-2 border-ink bg-white">
          <div className="px-4 pb-4 pt-6 text-center">
            <h1 className="text-2xl font-bold tracking-wide text-ink">{title}</h1>
          </div>
          <div className="bg-accent px-4 py-1.5 text-center text-xs font-medium text-white">
            {t('subtitle')}
          </div>
        </div>
      </header>

      {!locked && <ComposeSheet cellId={cellId} source={source} />}

      <section className="flex-1 py-4">
        {posts.length === 0 ? (
          <div className="rounded-lg border-2 border-ink bg-white px-4 py-16 text-center">
            <p className="text-sm text-stone-500">{t('empty')}</p>
            <p className="mt-1.5 text-sm font-medium text-stone-700">{t('emptyCta')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-200 overflow-hidden rounded-lg border-2 border-ink bg-white">
            {posts.map((post) => (
              <PostItem
                key={post.id}
                id={post.id}
                content={post.content}
                createdAt={post.createdAt.toISOString()}
                isOwn={post.deviceHash !== null && post.deviceHash === ctx.deviceHash}
              />
            ))}
          </ul>
        )}
      </section>

      <Footer />
    </main>
  )
}
