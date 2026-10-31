'use client'
import { useEffect } from 'react'
import { captureRefFromUrl } from '@/lib/referral'

// Dipasang dalam layout — simpan ?ref=KOD dari mana-mana halaman
export default function RefCapture() {
  useEffect(() => { captureRefFromUrl() }, [])
  return null
}
