// ── Admin API Route ──
// Semua operasi tulis admin melalui sini
// Service role key TIDAK pernah didedahkan kepada browser
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_PW = process.env.ADMIN_PASSWORD || '050505'

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('x-admin-key')
  return auth === ADMIN_PW
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, table, data, id } = await req.json()

  try {
    switch (action) {
      case 'insert': {
        const { data: result, error } = await supabaseAdmin.from(table).insert(data).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ data: result })
      }
      case 'update': {
        const { data: result, error } = await supabaseAdmin.from(table).update(data).eq('id', id).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ data: result })
      }
      case 'delete': {
        const { error } = await supabaseAdmin.from(table).delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true })
      }
      case 'upsert': {
        const { data: result, error } = await supabaseAdmin.from(table).upsert(data)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ data: result })
      }
      case 'delete_links_by_folder': {
        const { error } = await supabaseAdmin.from('links').delete().eq('folder_id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true })
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}