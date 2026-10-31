// ── Token sesi bertandatangan (HMAC-SHA256) — SERVER SAHAJA ──
// Format token: <payload>.<expiry_ms>.<signature>
// Guna Web Crypto supaya berfungsi dalam proxy/middleware dan API routes.

const enc = new TextEncoder()

function b64url(buf: ArrayBuffer): string {
  let s = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

// Perbandingan masa-tetap (elak timing attack)
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

export async function signToken(secret: string, payload: string, ttlSeconds: number): Promise<string> {
  const exp = Date.now() + ttlSeconds * 1000
  const body = `${payload}.${exp}`
  return `${body}.${await hmac(secret, body)}`
}

/** Pulangkan payload jika token sah & belum tamat, jika tidak null. */
export async function verifyToken(secret: string, token: string | undefined | null): Promise<string | null> {
  if (!token || !secret) return null
  const last = token.lastIndexOf('.')
  if (last < 0) return null
  const body = token.slice(0, last), sig = token.slice(last + 1)
  const dot = body.lastIndexOf('.')
  if (dot < 0) return null
  const payload = body.slice(0, dot), exp = Number(body.slice(dot + 1))
  if (!Number.isFinite(exp) || exp < Date.now()) return null
  if (!safeEqual(sig, await hmac(secret, body))) return null
  return payload
}

// ── Kunci rahsia ──
// Admin: ADMIN_SESSION_SECRET (wajib — tiada nilai lalai).
export function adminSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || ''
}
// Murid: STUDENT_SESSION_SECRET jika ada; jika tidak, diterbitkan daripada
// service role key (sudah rahsia & sedia ada dalam Vercel).
export function studentSecret(): string {
  const s = process.env.STUDENT_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return s ? `student:${s}` : ''
}

export const ADMIN_COOKIE = 'admin_session'
export const STUDENT_COOKIE = 'aedu_session'
export const ADMIN_TTL = 60 * 60 * 8          // 8 jam
export const STUDENT_TTL = 60 * 60 * 24 * 30  // 30 hari
