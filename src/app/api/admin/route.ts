// ── Admin API Route ──
// Semua operasi tulis admin melalui sini
// Service role key TIDAK pernah didedahkan kepada browser
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { isAdminRequest } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { action, table, data, id } = body

  // Hanya jadual ini boleh diakses melalui API admin
  const TABLES = ['links', 'folders', 'banners', 'students', 'payment_requests', 'app_settings', 'app_usage', 'affiliates', 'affiliate_commissions']
  if (table !== undefined && !TABLES.includes(table)) {
    return NextResponse.json({ error: 'Jadual tidak dibenarkan' }, { status: 400 })
  }

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
      case 'select': {
        // Baca data (service role). opts: columns, eq, neq, gte, order, ascending, limit
        const o = body.opts || {}
        let q = supabaseAdmin.from(table).select(typeof o.columns === 'string' ? o.columns : '*')
        for (const [k, v] of Object.entries(o.eq || {}))  q = q.eq(k, v as string)
        for (const [k, v] of Object.entries(o.neq || {})) q = q.neq(k, v as string)
        for (const [k, v] of Object.entries(o.gte || {})) q = q.gte(k, v as string)
        if (o.order) q = q.order(o.order, { ascending: !!o.ascending })
        if (o.limit) q = q.limit(Math.min(Number(o.limit) || 1000, 5000))
        const { data: result, error } = await q
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ data: result })
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