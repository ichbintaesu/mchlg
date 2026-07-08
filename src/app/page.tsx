import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SERVICE_NAME } from '@/config'
import { Footer } from '@/components/Footer'

export default async function Home() {
  const tCommon = await getTranslations('common')
  const tHere = await getTranslations('here')

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{SERVICE_NAME}</h1>
        <p className="text-stone-600">{tCommon('tagline')}</p>
        <Link
          href="/here"
          className="rounded-full bg-stone-900 px-8 py-3 font-medium text-stone-50"
        >
          {tHere('request')}
        </Link>
      </div>
      <Footer />
    </main>
  )
}
