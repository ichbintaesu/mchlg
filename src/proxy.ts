import { NextResponse, type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { DEVICE_COOKIE } from '@/config'

export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  if (!request.cookies.get(DEVICE_COOKIE)) {
    response.cookies.set(DEVICE_COOKIE, nanoid(24), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 * 2,
      path: '/',
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)).*)'],
}
