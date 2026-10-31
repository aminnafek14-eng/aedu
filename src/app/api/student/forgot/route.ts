import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

// POST /api/student/forgot — cari ID murid melalui no. telefon ibu bapa.
// Hanya ID & nama dipulangkan. Kata laluan TIDAK didedahkan — reset melalui admin.
export async function POST(req: NextRequest) {
  const { phone } = await req.json().catch(() => ({}))
  const digits = String(phone || '').replace(/[^0-9]/g, '')
  if (digits.length < 9) return NextResponse.json({ error: 'Masukkan nombor telefon yang sah' }, { status: 400 })

  // Padanan ringkas di DB dahulu (8 digit terakhir), kemudian tapis tepat di pelayan
  const { data } = await supabaseAdmin.from('students')
    .select('student_id, full_name, parent_phone')
    .ilike('parent_phone', `%${digits.slice(-8).split('').join('%')}%`)
    .limit(50)
  const matched = (data || [])
    .filter(s => String(s.parent_phone || '').replace(/[^0-9]/g, '') === digits)
    .map(s => ({ student_id: s.student_id, full_name: s.full_name }))

  if (!matched.length) {
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ error: 'Nombor telefon tidak dijumpai. Pastikan nombor yang didaftarkan dimasukkan.' }, { status: 404 })
  }
  return NextResponse.json({ results: matched })
}
