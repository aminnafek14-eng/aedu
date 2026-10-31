// ── Sesi murid (server sahaja) ──
import 'server-only'
import type { NextRequest, NextResponse } from 'next/server'
import { signToken, verifyToken, studentSecret, STUDENT_COOKIE, STUDENT_TTL } from './session'
import { supabaseAdmin } from './supabaseServer'

// Kolum yang selamat dihantar ke browser (TIADA password / parent_phone)
export const STUDENT_PUBLIC_COLS = 'id, full_name, student_id, is_subscribed, is_premium'

export type StudentPublic = {
  id: string; full_name: string; student_id: string; is_subscribed: boolean; is_premium: boolean
}

export async function setStudentCookie(res: NextResponse, studentId: string) {
  res.cookies.set(STUDENT_COOKIE, await signToken(studentSecret(), `s:${studentId}`, STUDENT_TTL), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STUDENT_TTL,
    path: '/',
  })
}

export async function getStudentId(req: NextRequest): Promise<string | null> {
  const payload = await verifyToken(studentSecret(), req.cookies.get(STUDENT_COOKIE)?.value)
  return payload?.startsWith('s:') ? payload.slice(2) : null
}

/** Murid semasa — status premium dibaca TERUS dari pangkalan data, bukan dari browser. */
export async function getStudent(req: NextRequest): Promise<StudentPublic | null> {
  const id = await getStudentId(req)
  if (!id) return null
  const { data } = await supabaseAdmin.from('students').select(STUDENT_PUBLIC_COLS).eq('id', id).maybeSingle()
  return (data as StudentPublic) || null
}

export const isPremiumStudent = (s: StudentPublic | null) => !!(s && (s.is_premium || s.is_subscribed))
