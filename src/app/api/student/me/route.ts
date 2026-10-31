import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getStudent } from '@/lib/studentAuth'

// GET /api/student/me — profil murid semasa + kemas kini last_seen (heartbeat).
// Dipanggil semasa buka halaman dan setiap 2 minit.
export async function GET(req: NextRequest) {
  const student = await getStudent(req)
  if (!student) return NextResponse.json({ error: 'Sila log masuk' }, { status: 401 })
  await supabaseAdmin.from('students').update({ last_seen: new Date().toISOString() }).eq('id', student.id)
  return NextResponse.json({ student }, { headers: { 'Cache-Control': 'private, no-store' } })
}
