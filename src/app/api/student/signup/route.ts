import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

// POST /api/student/signup — daftar murid melalui pelayan
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const name = String(b.full_name || '').trim().toUpperCase()
  const id = String(b.student_id || '').trim().toLowerCase()
  const password = String(b.password || '')
  const phone = String(b.parent_phone || '').trim().replace(/\s+/g, '')
  const ref = b.referred_by ? String(b.referred_by).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20) : null

  if (!name) return NextResponse.json({ error: 'Masukkan nama penuh murid' }, { status: 400 })
  if (id.length < 3 || !/^[a-z0-9]+$/.test(id)) return NextResponse.json({ error: 'ID mestilah sekurang-kurangnya 3 aksara (huruf kecil & nombor sahaja)' }, { status: 400 })
  if (password.length < 4) return NextResponse.json({ error: 'Kata laluan mestilah sekurang-kurangnya 4 aksara' }, { status: 400 })
  if (phone.length < 9) return NextResponse.json({ error: 'Masukkan nombor telefon yang sah' }, { status: 400 })

  const [{ data: existId }, { data: existName }] = await Promise.all([
    supabaseAdmin.from('students').select('id').eq('student_id', id).maybeSingle(),
    supabaseAdmin.from('students').select('id').eq('full_name', name).maybeSingle(),
  ])
  if (existId) return NextResponse.json({ error: 'ID ini sudah digunakan. Pilih ID lain.' }, { status: 409 })
  if (existName) return NextResponse.json({ error: 'Nama ini sudah berdaftar.' }, { status: 409 })

  const { error } = await supabaseAdmin.from('students').insert({
    full_name: name, student_id: id, password, parent_phone: phone,
    is_subscribed: false, referred_by: ref,
    subscription_note: b.with_payment ? `Menunggu pengesahan bayaran RM${String(b.price || '').replace(/[^0-9.]/g, '')}` : null,
  })
  if (error) return NextResponse.json({ error: 'Ralat pendaftaran. Cuba lagi.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
