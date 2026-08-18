import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── CLIENT untuk murid (anon key) — guna dalam browser ──
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'aedu-anon',
    autoRefreshToken: false,
    persistSession: false,
  }
})

// ── CLIENT untuk admin (service role) — HANYA guna dalam server API routes ──
// Key ini TIDAK pernah sampai ke browser
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    storageKey: 'aedu-admin',
    autoRefreshToken: false,
    persistSession: false,
  }
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
