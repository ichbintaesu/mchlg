import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { loginAction } from './actions'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (await isAdminAuthenticated()) redirect('/admin/posts')

  const { error } = await searchParams

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-lg font-bold">Admin</h1>
      <form action={loginAction} className="w-full space-y-3">
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-stone-100 outline-none"
        />
        {error && <p className="text-xs text-accent">비밀번호가 올바르지 않습니다.</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-stone-50 py-2.5 text-sm font-medium text-ink"
        >
          로그인
        </button>
      </form>
    </main>
  )
}
