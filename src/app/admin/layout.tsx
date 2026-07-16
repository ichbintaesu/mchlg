import { isAdminAuthenticated } from '@/lib/admin-auth'
import { logoutAction } from './actions'
import { AdminNav } from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthenticated()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5">
      {authed && (
        <header className="mb-6 flex items-center justify-between border-b border-stone-200 pb-3">
          <AdminNav />
          <form action={logoutAction}>
            <button type="submit" className="text-xs text-stone-500 underline">
              로그아웃
            </button>
          </form>
        </header>
      )}
      {children}
    </div>
  )
}
