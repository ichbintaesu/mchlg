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
      className="glass rounded-full px-3 py-1 text-[11px] text-stone-400 outline-none [&_option]:text-ink"
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
