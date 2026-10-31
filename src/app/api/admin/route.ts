// ── Admin API Route ──
// Semua operasi tulis admin melalui sini
// Service role key TIDAK pernah didedahkan kepada browser
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
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
      // ── AFFILIATE ──
      case 'affiliates_overview': {
        const { data: result, error } = await supabaseAdmin.rpc('admin_affiliate_overview')
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ data: result })
      }
      case 'affiliate_mark_paid': {
        // Tandakan SEMUA komisen belum dibayar bagi seorang affiliate sebagai dibayar
        const { data: result, error } = await supabaseAdmin
          .from('affiliate_commissions')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('affiliate_id', id).eq('status', 'pending')
          .select('id')
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ data: { count: result?.length || 0 } })
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}