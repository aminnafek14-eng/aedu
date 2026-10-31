import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, adminSecret, ADMIN_COOKIE } from '@/lib/session'

// Lindungi semua laluan /admin (kecuali /admin/login) di pelayan
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const ok = (await verifyToken(adminSecret(), req.cookies.get(ADMIN_COOKIE)?.value)) === 'admin'
    if (!ok) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
