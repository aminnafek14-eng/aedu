'use client'
// ── AEdu Signup — nama penuh + no tel ibu bapa ──
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async () => {
    const name = fullName.trim().toUpperCase()
    const phoneClean = phone.trim().replace(/\s+/g, '')
    if (!name) return setError('Sila masukkan nama penuh murid')
    if (!phoneClean || phoneClean.length < 9) return setError('Sila masukkan nombor telefon yang sah')
    setLoading(true); setError('')

    // Check duplicate
    const { data: existing } = await supabase
      .from('students').select('id').eq('full_name', name).single()
    if (existing) {
      setLoading(false)
      return setError('Nama ini sudah berdaftar. Sila log masuk.')
    }

    const { error: err } = await supabase.from('students').insert({
      full_name: name,
      parent_phone: phoneClean,
    })
    if (err) {
      setError('Ralat pendaftaran. Cuba lagi.')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Pendaftaran Berjaya!</h2>
        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>Akaun <strong>{fullName.toUpperCase()}</strong> telah dibuat. Sila log masuk.</p>
        <Link href="/login" style={S.btn}>Log Masuk Sekarang →</Link>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>🎓</div>
        <h1 style={S.title}>Daftar Akaun</h1>
        <p style={S.sub}>Isi maklumat di bawah untuk mula belajar</p>

        <div style={S.formGroup}>
          <label style={S.label}>Nama Penuh Murid</label>
          <input
            style={S.input}
            placeholder="cth: AHMAD BIN ALI"
            value={fullName}
            onChange={e => setFullName(e.target.value.toUpperCase())}
            autoCapitalize="characters"
          />
          <p style={S.hint}>✨ Tulisan bertukar besar secara automatik</p>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Nombor Telefon Ibu/Bapa</label>
          <input
            style={S.input}
            placeholder="cth: 0123456789"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/[^0-9+\-\s]/g, ''))}
            type="tel"
            inputMode="tel"
          />
        </div>

        {error && <div style={S.err}>{error}</div>}

        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSignup} disabled={loading}>
          {loading ? 'Mendaftar...' : 'Daftar Sekarang →'}
        </button>

        <div style={S.divider}><span>Sudah ada akaun?</span></div>
        <Link href="/login" style={S.loginLink}>Log Masuk</Link>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)', padding: 16 },
  card: { background: 'white', borderRadius: 24, padding: '40px 28px', width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', textAlign: 'center' },
  logo: { width: 64, height: 64, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 14px' },
  title: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 },
  sub: { color: '#64748B', fontSize: 13, marginBottom: 24 },
  formGroup: { textAlign: 'left', marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '13px 15px', border: '2px solid #E2E8F0', borderRadius: 10, fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: "'Inter',sans-serif" },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
  err: { background: '#FEF2F2', color: '#EF4444', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, textAlign: 'left' },
  btn: { display: 'block', width: '100%', padding: 14, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", textDecoration: 'none', textAlign: 'center' },
  divider: { margin: '16px 0 10px', fontSize: 12, color: '#94A3B8' },
  loginLink: { display: 'block', padding: '12px', background: '#F1F5F9', color: '#4F46E5', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', border: '1px solid #E2E8F0' },
}
