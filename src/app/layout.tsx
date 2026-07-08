import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { SERVICE_NAME, TIME_ZONE } from '@/config'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common')
  return {
    title: SERVICE_NAME,
    description: t('tagline'),
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="bg-stone-50 text-stone-900 antialiased">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone={TIME_ZONE}>
          <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">{children}</div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
