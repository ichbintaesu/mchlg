import Link from 'next/link'
import { SERVICE_NAME } from '@/config'
import { Footer } from '@/components/Footer'

export default function StaticLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col">
      <header className="py-6">
        <Link href="/" className="text-sm font-bold tracking-tight text-stone-500">
          {SERVICE_NAME}
          <span className="text-accent">.</span>
        </Link>
      </header>
      <article className="prose-sm flex-1 space-y-4 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-stone-50 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-stone-100 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-stone-300 [&_li]:text-sm [&_li]:text-stone-300 [&_strong]:text-stone-100">
        {children}
      </article>
      <Footer />
    </main>
  )
}
