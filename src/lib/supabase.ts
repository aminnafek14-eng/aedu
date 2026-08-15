import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  url: string
  img_url: string | null
  emoji: string
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
  parent_phone: string
  created_at: string
}
