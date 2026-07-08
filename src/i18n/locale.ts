import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/config'

export function matchLocale(cookieLocale: string | undefined, acceptLanguage: string | null): Locale {
  if (cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale
  }

  if (!acceptLanguage) return DEFAULT_LOCALE

  const candidates = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase())
    .filter(Boolean)

  for (const tag of candidates) {
    if (tag.startsWith('ja')) return 'ja'
    if (tag.startsWith('ko')) return 'ko'
    if (tag.startsWith('en')) return 'en'
    if (tag.startsWith('zh')) {
      if (tag.includes('tw') || tag.includes('hk') || tag.includes('hant')) return 'zh-Hant'
      return 'zh-Hans'
    }
  }

  return DEFAULT_LOCALE
}
