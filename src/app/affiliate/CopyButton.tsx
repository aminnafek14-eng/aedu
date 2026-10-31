'use client'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { C } from './shared'

export default function CopyButton({ text, label = 'Salin', style }: { text: string; label?: string; style?: CSSProperties }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text) } catch {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove()
    }
    setDone(true); setTimeout(() => setDone(false), 1800)
  }
  return (
    <button type="button" onClick={copy} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: done ? C.green : C.brand, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', ...style }}>
      {done ? '✓ Disalin' : label}
    </button>
  )
}
