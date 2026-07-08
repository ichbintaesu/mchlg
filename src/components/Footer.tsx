import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LocaleSwitcher } from './LocaleSwitcher'

export async function Footer() {
  const t = await getTranslations('footer')

  return (
    <footer className="mt-auto space-y-3 py-6">
      <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
        <Link href="/about">{t('about')}</Link>
        <Link href="/guidelines">{t('guidelines')}</Link>
        <Link href="/privacy">{t('privacy')}</Link>
        <Link href="/terms">{t('terms')}</Link>
        <Link href="/contact">{t('contact')}</Link>
      </nav>
      <LocaleSwitcher />
    </footer>
  )
}
