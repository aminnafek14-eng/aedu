// ── Semakan sesi admin (server sahaja) ──
// Cookie httpOnly 'admin_session' mengandungi token bertandatangan HMAC
// yang tamat tempoh selepas 8 jam. Tiada kata laluan dalam cookie.
import type { NextRequest } from 'next/server'
import { verifyToken, adminSecret, ADMIN_COOKIE } from './session'

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  return (await verifyToken(adminSecret(), req.cookies.get(ADMIN_COOKIE)?.value)) === 'admin'
}
