import { cookies } from 'next/headers'
import { ADMIN_COOKIE } from '@/config'
import { verifyAdminSession } from './crypto'

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)
}
