import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getStudentId } from '@/lib/studentAuth'

// POST /api/student/payment — hantar permintaan upgrade premium.
// Nama, telefon & harga diambil dari DB — bukan dari browser. Status sentiasa 'pending'.
export async function POST(req: NextRequest) {
  const id = await getStudentId(req)
  if (!id) return NextResponse.json({ error: 'Sila log masuk' }, { status: 401 })
  const b = await req.json().catch(() => ({}))

  const [{ data: s }, { data: price }, { data: existing }] = await Promise.all([
    supabaseAdmin.from('students').select('id, full_name, parent_phone').eq('id', id).maybeSingle(),
    supabaseAdmin.from('app_settings').select('value').eq('key', 'payment_price').maybeSingle(),
    supabaseAdmin.from('payment_requests').select('id').eq('student_id', id).eq('status', 'pending').limit(1),
  ])
  if (!s) return NextResponse.json({ error: 'Murid tidak dijumpai' }, { status: 404 })
  if (existing?.length) return NextResponse.json({ success: true, duplicate: true })

  const proof = typeof b.proof_url === 'string' && b.proof_url.startsWith('https://') ? b.proof_url.slice(0, 500) : null
  const code = b.affiliate_code ? String(b.affiliate_code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20) : null

  const { error } = await supabaseAdmin.from('payment_requests').insert({
    student_id: s.id, full_name: s.full_name, parent_phone: s.parent_phone || '',
    amount: price?.value || '50', proof_url: proof, status: 'pending', affiliate_code: code,
  })
  if (error) return NextResponse.json({ error: 'Gagal menghantar. Cuba lagi.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
