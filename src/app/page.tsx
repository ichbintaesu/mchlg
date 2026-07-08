import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SERVICE_NAME } from '@/config'
import { Footer } from '@/components/Footer'

export default async function Home() {
  const tCommon = await getTranslations('common')

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-stone-50">
            {SERVICE_NAME}
            <span className="text-accent">.</span>
          </h1>
          <p className="text-sm text-stone-400">{tCommon('tagline')}</p>
        </div>
        <Link
          href="/here"
          className="glossy rounded-full bg-stone-50 px-12 py-4 text-base font-semibold text-ink transition-transform duration-150 active:scale-95"
        >
          {tCommon('start')}
        </Link>
      </div>
      <Footer />
    </main>
  )
}
