import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
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
  themeColor: '#f6f4f0',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="text-ink antialiased">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-accent opacity-[0.1] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-[#8b93ff] opacity-[0.08] blur-3xl" />
        </div>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone={TIME_ZONE}>
          <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">{children}</div>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
