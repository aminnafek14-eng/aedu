// ── Supabase client untuk AFFILIATE ──
// Guna Supabase Auth (emel + kata laluan). Sesi disimpan dalam browser
// supaya setiap request membawa JWT affiliate → RLS guna auth.uid().
import { createClient } from '@supabase/supabase-js'

export const supabaseAff = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storageKey: 'aedu-affiliate',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export type AffiliateProfile = {
  full_name: string
  phone: string | null
  email: string | null
  code: string
  commission_rate: number
  status: 'pending' | 'active' | 'suspended'
  bank_name: string | null
  account_name: string | null
  account_number: string | null
  created_at: string
}

export type AffiliateStats = {
  signups: number
  sales: number
  sales_amount: number
  commission_total: number
  commission_pending: number
  commission_paid: number
  commission_month: number
  rows: number
}

export type Commission = {
  id: string
  student_label: string | null
  sale_amount: number
  rate: number
  commission_amount: number
  status: 'pending' | 'paid' | 'cancelled'
  created_at: string
  paid_at: string | null
}
