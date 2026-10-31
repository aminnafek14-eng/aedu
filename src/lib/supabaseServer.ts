// ── Supabase SERVICE ROLE client — SERVER SAHAJA ──
// Jangan import fail ini dalam komponen 'use client'.
// 'server-only' memastikan build gagal jika tersilap diimport ke browser.
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
