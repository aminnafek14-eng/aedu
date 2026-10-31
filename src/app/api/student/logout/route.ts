import { NextResponse } from 'next/server'
import { STUDENT_COOKIE } from '@/lib/session'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(STUDENT_COOKIE)
  return res
}
