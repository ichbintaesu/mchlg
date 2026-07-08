import { cookies, headers } from 'next/headers'
import { DEVICE_COOKIE } from '@/config'
import { sha256 } from './crypto'

export interface RequestContext {
  deviceHash: string | null
  ip: string | null
  ipHash: string | null
  deviceLanguage: string | null
  country: string | null
  userAgent: string | null
}

export async function getRequestContext(): Promise<RequestContext> {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const deviceId = cookieStore.get(DEVICE_COOKIE)?.value ?? null
  const ip =
    headerStore.get('x-real-ip') ?? headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const acceptLanguage = headerStore.get('accept-language')
  const deviceLanguage = acceptLanguage?.split(',')[0]?.trim() ?? null

  return {
    deviceHash: deviceId ? sha256(deviceId) : null,
    ip,
    ipHash: ip ? sha256(ip) : null,
    deviceLanguage,
    country: headerStore.get('x-vercel-ip-country'),
    userAgent: headerStore.get('user-agent'),
  }
}
