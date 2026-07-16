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
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {SERVICE_NAME}
            <span className="text-accent-deep">.</span>
          </h1>
          <p className="text-sm text-stone-500">{t('tagline')}</p>
        </div>
        <HereClient source={source} />
      </div>
      <Footer />
    </main>
  )
}
