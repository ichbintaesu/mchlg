import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { loginAction } from './actions'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (await isAdminAuthenticated()) redirect('/admin/dashboard')

  const { error } = await searchParams

  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-xs space-y-4">
        <h1 className="text-lg font-bold">machilog admin</h1>
        <form action={loginAction} className="space-y-3">
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500"
          />
          {error && <p className="text-xs text-red-600">비밀번호가 올바르지 않습니다.</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-stone-900 py-2.5 text-sm font-medium text-white"
          >
            로그인
          </button>
        </form>
      </div>
    </main>
  )
}
