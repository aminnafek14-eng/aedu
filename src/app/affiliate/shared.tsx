import type { CSSProperties, ReactNode } from 'react'

// ── Gaya dikongsi untuk semua halaman affiliate ──
export const C = {
  ink: '#0F172A', sub: '#64748B', mute: '#94A3B8', line: '#E2E8F0', soft: '#F8FAFC',
  brand: '#4F46E5', brand2: '#6366F1', brandSoft: '#EEF2FF',
  green: '#10B981', greenSoft: '#ECFDF5', amber: '#D97706', amberSoft: '#FFFBEB',
  red: '#EF4444', redSoft: '#FEF2F2',
}

export const S: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#F0F4FF 0%,#EEF2FF 50%,#F5F3FF 100%)', fontFamily: "'Inter',sans-serif", padding: '24px 16px', color: C.ink },
  authCard: { background: 'white', borderRadius: 24, padding: '36px 28px', boxShadow: '0 20px 60px rgba(79,70,229,0.12)', width: '100%', maxWidth: 400, margin: '40px auto' },
  card: { background: 'white', borderRadius: 16, border: `1px solid ${C.line}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 18, marginBottom: 14 },
  h1: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 900, margin: 0 },
  h2: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, margin: '0 0 12px' },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '12px 14px', border: `1.5px solid ${C.line}`, borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif", background: 'white' },
  btn: { width: '100%', padding: 14, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${C.brand},${C.brand2})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnGhost: { padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${C.line}`, background: 'white', color: C.sub, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  err: { background: C.redSoft, color: C.red, border: '1px solid #FECACA', borderRadius: 10, padding: '10px 12px', fontSize: 12, fontWeight: 600, marginBottom: 14 },
  ok: { background: C.greenSoft, color: '#047857', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px 12px', fontSize: 12, fontWeight: 600, marginBottom: 14 },
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={S.label}>{label}</label>{children}</div>
}

export function Logo({ sub }: { sub: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <img src="/logo.png" alt="AEdu" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 8 }} />
      <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>AEdu Affiliate</div>
      <div style={{ fontSize: 12, color: C.mute, fontWeight: 600, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

export const rm = (n: number | string | null | undefined) =>
  'RM' + Number(n || 0).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
