'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/dashboard', label: '대시보드' },
  { href: '/admin/posts', label: '글' },
  { href: '/admin/reports', label: '신고' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 text-sm">
      <span className="mr-3 font-bold text-ink">machilog admin</span>
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 ${
              active ? 'bg-stone-900 font-medium text-white' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
