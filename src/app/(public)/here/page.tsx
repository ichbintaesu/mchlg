import { getLocale, getTranslations } from 'next-intl/server'
import { SERVICE_NAME } from '@/config'
import { getRequestContext } from '@/lib/request-context'
import { trackEvent } from '@/lib/events'
import { Footer } from '@/components/Footer'
import { HereClient } from './HereClient'

export default async function HerePage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>
}) {
  const { s } = await searchParams
  const source = typeof s === 'string' ? s.slice(0, 32) : undefined
  const [ctx, locale, t] = await Promise.all([
    getRequestContext(),
    getLocale(),
    getTranslations('common'),
  ])

  await trackEvent({ type: 'scan', ctx, uiLocale: locale, source })

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-9 text-center">
        <div className="w-full max-w-72 overflow-hidden rounded-lg border-2 border-ink bg-white">
          <div className="px-4 pb-4 pt-6">
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              {SERVICE_NAME}
              <span className="text-accent">.</span>
            </h1>
          </div>
          <div className="bg-accent px-4 py-1.5 text-xs font-medium text-white">{t('tagline')}</div>
        </div>
        <HereClient source={source} />
      </div>
      <Footer />
    </main>
  )
}
