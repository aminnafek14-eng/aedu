import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// Service role key - only available server-side, never exposed to browser
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── CLIENT untuk murid (anon key) ──
// RLS akan enforce: premium links hanya untuk premium students
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── CLIENT untuk admin (service role key) ──
// Bypass RLS sepenuhnya — HANYA guna di server-side atau admin panel
// Service role key TIDAK dedahkan kepada browser murid
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export type Folder = {
  id: string
  name: string
  img_url: string | null
  emoji: string
  order_num: number
  created_at: string
}

export type Link = {
  id: string
  folder_id: string
  name: string
  url: string | null
  html_content: string | null
  content_type: 'url' | 'html'
  img_url: string | null
  emoji: string
  tags: string[]
  access_type: 'free' | 'premium'
  order_num: number
  created_at: string
}

export type Banner = {
  id: string
  title: string
  img_url: string | null
  link_url: string | null
  order_num: number
  active: boolean
  created_at: string
}

export type Student = {
  id: string
  full_name: string
  student_id: string
  password: string
  parent_phone: string
  is_subscribed: boolean
  is_premium: boolean
  last_login: string | null
  subscription_note: string | null
  created_at: string
}

export type AppSetting = {
  key: string
  value: string
  updated_at: string
}
