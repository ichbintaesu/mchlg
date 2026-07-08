import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SERVICE_NAME } from '@/config'
import { Footer } from '@/components/Footer'

export default async function Home() {
  const tCommon = await getTranslations('common')

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div className="flex size-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#ffb199] to-accent-deep shadow-xl shadow-accent/30">
          <span className="text-4xl">💬</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{SERVICE_NAME}</h1>
          <p className="text-sm text-stone-500">{tCommon('tagline')}</p>
        </div>
        <Link
          href="/here"
          className="glossy rounded-full bg-gradient-to-b from-[#ff7d64] to-accent-deep px-12 py-4 text-base font-semibold text-white transition-transform duration-150 active:scale-95"
        >
          {tCommon('start')}
        </Link>
      </div>
      <Footer />
    </main>
  )
}
