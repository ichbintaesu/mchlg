import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE, TIME_ZONE } from '@/config'
import { matchLocale } from './locale'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const locale = matchLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get('accept-language'),
  )

  return {
    locale,
    timeZone: TIME_ZONE,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
