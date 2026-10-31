import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getStudent, isPremiumStudent } from '@/lib/studentAuth'

// GET /api/play?id=<link_id>
// Satu-satunya jalan untuk mendapatkan KOD GAME / URL aktiviti.
// - Mesti log masuk sebagai murid.
// - Aktiviti PREMIUM hanya untuk murid yang status premiumnya disahkan di DB.
export async function GET(req: NextRequest) {
  const noStore = { 'Cache-Control': 'private, no-store' }
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id diperlukan' }, { status: 400, headers: noStore })

  const student = await getStudent(req)
  if (!student) return NextResponse.json({ error: 'Sila log masuk' }, { status: 401, headers: noStore })

  const { data: link } = await supabaseAdmin.from('links')
    .select('id, name, content_type, url, html_content, access_type')
    .eq('id', id).maybeSingle()
  if (!link) return NextResponse.json({ error: 'Aktiviti tidak dijumpai' }, { status: 404, headers: noStore })

  if (link.access_type === 'premium' && !isPremiumStudent(student)) {
    return NextResponse.json({ error: 'premium_required' }, { status: 403, headers: noStore })
  }

  // Rekod penggunaan apps
  await supabaseAdmin.from('app_usage').insert({ student_id: student.id, link_id: link.id, link_name: link.name })

  return NextResponse.json({
    content_type: link.content_type,
    url: link.content_type === 'url' ? link.url : null,
    html_content: link.content_type === 'html' ? link.html_content : null,
  }, { headers: noStore })
}
