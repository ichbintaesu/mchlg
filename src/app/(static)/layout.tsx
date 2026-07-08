import Link from 'next/link'
import { SERVICE_NAME } from '@/config'
import { Footer } from '@/components/Footer'

export default function StaticLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col">
      <header className="py-6">
        <Link href="/" className="text-sm font-bold tracking-tight text-stone-400">
          {SERVICE_NAME}
        </Link>
      </header>
      <article className="prose-sm flex-1 space-y-4 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_p]:text-sm [&_p]:leading-relaxed [&_li]:text-sm">
        {children}
      </article>
      <Footer />
    </main>
  )
}
