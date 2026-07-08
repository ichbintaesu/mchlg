import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { SERVICE_NAME } from '@/config'
import { isValidCellId } from '@/lib/h3'
import { getCell, listCellPosts } from '@/lib/posts'
import { getRequestContext } from '@/lib/request-context'
import { trackEvent } from '@/lib/events'
import { Footer } from '@/components/Footer'
import { PostItem } from '@/components/PostItem'
import { ComposeSheet } from '@/components/ComposeSheet'

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

  const [{ posts, neighborFill }, ctx, locale, t] = await Promise.all([
    listCellPosts(cellId),
    getRequestContext(),
    getLocale(),
    getTranslations('cell'),
  ])

  await trackEvent({
    type: 'cell_view',
    ctx,
    uiLocale: locale,
    cellId,
    source,
    meta: { visibleCount: posts.filter((p) => !p.isNeighbor).length, neighborFill },
  })

  const locked = cell?.status === 'locked'

  return (
    <main className="flex flex-1 flex-col">
      <header className="space-y-1.5 py-7">
        <p className="text-xs font-bold tracking-tight text-stone-300">{SERVICE_NAME}</p>
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />
            <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            {cell?.roughName ?? t('title')}
          </h1>
        </div>
        <p className="text-xs text-stone-400">{t('subtitle')}</p>
      </header>

      {!locked && <ComposeSheet cellId={cellId} source={source} />}

      <section className="flex-1 py-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="text-3xl">🌱</span>
            <div>
              <p className="text-sm text-stone-400">{t('empty')}</p>
              <p className="mt-1 text-sm font-medium text-stone-600">{t('emptyCta')}</p>
            </div>
          </div>
        ) : (
          <>
            {neighborFill && (
              <p className="pb-3 text-xs text-stone-400">{t('neighborNotice')}</p>
            )}
            <ul className="space-y-3">
              {posts.map((post) => (
                <PostItem
                  key={post.id}
                  id={post.id}
                  content={post.content}
                  createdAt={post.createdAt.toISOString()}
                  isNeighbor={post.isNeighbor}
                  isOwn={post.deviceHash !== null && post.deviceHash === ctx.deviceHash}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      <Footer />
    </main>
  )
}
