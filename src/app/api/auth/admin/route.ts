import { NextRequest, NextResponse } from 'next/server'
import { signToken, safeEqual, adminSecret, ADMIN_COOKIE, ADMIN_TTL } from '@/lib/session'

// Kata laluan & rahsia HANYA dari environment variable Vercel — tiada nilai lalai dalam kod.

// POST /api/auth/admin — login
export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD || ''
  const secret = adminSecret()
  if (!expected || !secret) {
    return NextResponse.json({ error: 'Pelayan belum dikonfigurasi (ADMIN_PASSWORD / ADMIN_SESSION_SECRET)' }, { status: 500 })
  }

  const { password } = await req.json().catch(() => ({ password: '' }))
  if (typeof password !== 'string' || !safeEqual(password, expected)) {
    await new Promise(r => setTimeout(r, 800)) // perlahankan cubaan meneka
    return NextResponse.json({ error: 'Kata laluan salah' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_COOKIE, await signToken(secret, 'admin', ADMIN_TTL), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ADMIN_TTL,
    path: '/',
  })
  return res
}

// DELETE /api/auth/admin — logout
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(ADMIN_COOKIE)
  return res
}
