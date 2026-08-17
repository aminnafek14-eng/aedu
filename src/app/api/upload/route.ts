// ── Upload API Route ──
// Upload gambar melalui server menggunakan service role key
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_PW = process.env.ADMIN_PASSWORD || '050505'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-admin-key')
  if (auth !== ADMIN_PW) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'png'
  const fname = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = await file.arrayBuffer()

  const { error } = await supabaseAdmin.storage
    .from('images')
    .upload(fname, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data } = supabaseAdmin.storage.from('images').getPublicUrl(fname)
  return NextResponse.json({ url: data.publicUrl })
}