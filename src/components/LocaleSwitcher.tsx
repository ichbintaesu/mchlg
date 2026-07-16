'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { LOCALE_COOKIE, LOCALES } from '@/config'

const LABELS: Record<string, string> = {
  ja: '日本語',
  en: 'English',
  ko: '한국어',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
}

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()

  const handleChange = (value: string) => {
    document.cookie = `${LOCALE_COOKIE}=${value};path=/;max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-600 outline-none"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LABELS[l]}
        </option>
      ))}
    </select>
  )
}
