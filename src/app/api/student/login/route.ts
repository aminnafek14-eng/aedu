import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { setStudentCookie, STUDENT_PUBLIC_COLS } from '@/lib/studentAuth'
import { safeEqual } from '@/lib/session'

// POST /api/student/login — semak kata laluan DI PELAYAN. Kata laluan tidak pernah dihantar balik.
export async function POST(req: NextRequest) {
  const { student_id, password } = await req.json().catch(() => ({}))
  const sid = String(student_id || '').trim().toLowerCase()
  const pw = String(password || '')
  if (!sid || !pw) return NextResponse.json({ error: 'Masukkan ID dan kata laluan' }, { status: 400 })

  const { data } = await supabaseAdmin.from('students').select(`${STUDENT_PUBLIC_COLS}, password`).eq('student_id', sid).maybeSingle()
  if (!data || !data.password || !safeEqual(pw, String(data.password))) {
    await new Promise(r => setTimeout(r, 600))
    return NextResponse.json({ error: !data ? 'ID tidak dijumpai. Semak semula atau daftar dahulu.' : 'Kata laluan salah. Cuba lagi.' }, { status: 401 })
  }

  await supabaseAdmin.from('students').update({ last_login: new Date().toISOString(), last_seen: new Date().toISOString() }).eq('id', data.id)

  const { password: _pw, ...student } = data
  void _pw
  const res = NextResponse.json({ student })
  await setStudentCookie(res, data.id)
  return res
}
