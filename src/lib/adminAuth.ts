// ── Semakan sesi admin (server sahaja) ──
// Cookie httpOnly 'admin_session' ditetapkan oleh /api/auth/admin semasa login.
import type { NextRequest } from 'next/server'

export function isAdminRequest(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET || 'aedu-admin-secret'
  return req.cookies.get('admin_session')?.value === secret
}
