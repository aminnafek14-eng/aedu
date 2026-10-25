import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '050505'
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'aedu-admin-secret'

// POST /api/auth/admin — login
export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Kata laluan salah' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })

  // Set httpOnly cookie — tidak boleh dicuri via JavaScript
  res.cookies.set('admin_session', ADMIN_SESSION_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 jam
    path: '/',
  })

  return res
}

// DELETE /api/auth/admin — logout
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('admin_session')
  return res
}
