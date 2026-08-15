'use client'
// ── AEdu Login — nama penuh sahaja, auto uppercase ──
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const trimmed = name.trim().toUpperCase()
    if (!trimmed) return setError('Sila masukkan nama penuh anda')
    setLoading(true); setError('')
    const { data, error: err } = await supabase
      .from('students')
      .select('*')
      .eq('full_name', trimmed)
      .single()
    if (err || !data) {
      setError('Nama tidak dijumpai. Sila daftar dahulu atau semak ejaan.')
    } else {
      sessionStorage.setItem('aedu_student', JSON.stringify({ id: data.id, full_name: data.full_name }))
      router.replace('/')
    }
    setLoading(false)
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>🎓</div>
        <h1 style={S.title}>AEdu</h1>
        <p style={S.sub}>Portal Gamifikasi Pendidikan</p>

        <div style={S.formGroup}>
          <label style={S.label}>Nama Penuh Murid</label>
          <input
            style={S.input}
            placeholder="cth: AHMAD BIN ALI"
            value={name}
            onChange={e => setName(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="name"
            autoCapitalize="characters"
          />
          <p style={S.hint}>✨ Tulisan akan bertukar besar secara automatik</p>
        </div>

        {error && <div style={S.err}>{error}</div>}

        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Menyemak...' : 'Log Masuk →'}
        </button>

        <div style={S.divider}><span>Belum ada akaun?</span></div>
        <Link href="/signup" style={S.signupLink}>Daftar Sekarang</Link>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)', padding: 16 },
  card: { background: 'white', borderRadius: 24, padding: '40px 28px', width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', textAlign: 'center' },
  logo: { width: 72, height: 72, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, margin: '0 auto 14px' },
  title: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 },
  sub: { color: '#64748B', fontSize: 13, marginBottom: 28 },
  formGroup: { textAlign: 'left', marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: 10, fontSize: 16, fontWeight: 600, outline: 'none', letterSpacing: '0.05em', fontFamily: "'Inter',sans-serif", textTransform: 'uppercase' },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  err: { background: '#FEF2F2', color: '#EF4444', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, textAlign: 'left' },
  btn: { width: '100%', padding: 14, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" },
  divider: { margin: '18px 0 12px', fontSize: 12, color: '#94A3B8' },
  signupLink: { display: 'block', padding: '12px', background: '#F1F5F9', color: '#4F46E5', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', border: '1px solid #E2E8F0' },
}
