'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Mode = 'login' | 'forgot'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotResults, setForgotResults] = useState<{ student_id: string; full_name: string }[]>([])
  const [forgotResult, setForgotResult] = useState<{ student_id: string; full_name: string } | null>(null)
  const [showPw, setShowPw] = useState(false)

  const [adminWa, setAdminWa] = useState('')
  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'payment_whatsapp').maybeSingle()
      .then(({ data }) => setAdminWa(data?.value || ''))
  }, [])

  const handleLogin = async () => {
    if (!studentId.trim()) return setError('Masukkan ID murid')
    if (!password.trim()) return setError('Masukkan kata laluan')
    setLoading(true); setError('')

    // Kata laluan disemak di PELAYAN — tiada data murid dimuat turun ke browser
    const res = await fetch('/api/student/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId.trim().toLowerCase(), password }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { setError(json.error || 'Gagal log masuk. Cuba lagi.'); setLoading(false); return }

    // Simpan maklumat paparan sahaja (nama dsb). Akses sebenar ditentukan oleh cookie di pelayan.
    const sessionData = JSON.stringify(json.student)
    sessionStorage.setItem('aedu_student', sessionData)
    localStorage.setItem('aedu_student', sessionData)
    router.replace('/')
    setLoading(false)
  }

  const handleForgot = async () => {
    if (!parentPhone.trim()) return setError('Masukkan nombor telefon ibu/bapa')
    setLoading(true); setError('')
    const res = await fetch('/api/student/forgot', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: parentPhone }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) setError(json.error || 'Ralat. Cuba lagi.')
    else if (json.results.length === 1) setForgotResult(json.results[0])
    else setForgotResults(json.results)
    setLoading(false)
  }

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .card { animation: fadeIn 0.3s ease; }
        input:focus { border-color: #4F46E5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.12) !important; }
        .pw-toggle:hover { color: #4F46E5; }
      `}</style>

      <div className="card" style={S.card}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo.png" alt="AEdu" style={{ width: 88, height: 88, objectFit: 'contain' }} />
          <h1 style={S.title}>AEdu.my</h1>
          <p style={S.sub}>Portal Gamifikasi Pendidikan</p>

        </div>

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <>
            <div style={S.formGroup}>
              <label style={S.label}>ID Murid</label>
              <input style={S.input} placeholder="cth: ahmadyusof" value={studentId}
                onChange={e => setStudentId(e.target.value.toLowerCase().split('').filter(c => c !== ' ').join(''))}
                onKeyDown={e => { if(e.key === ' ') { e.preventDefault(); return; } if(e.key === 'Enter') handleLogin() }} autoComplete="username" />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Kata Laluan</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...S.input, paddingRight: 44 }}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Masukkan kata laluan"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} autoComplete="current-password" />
                <button className="pw-toggle" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94A3B8', transition: 'color 0.15s' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <div style={S.err}>{error}</div>}

            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
              {loading ? 'Menyemak...' : 'Log Masuk →'}
            </button>

            <button onClick={() => { setMode('forgot'); setError(''); setForgotResult(null) }}
              style={{ background: 'none', border: 'none', color: '#6366F1', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 12, width: '100%', textAlign: 'center' }}>
              🔑 Lupa Kata Laluan?
            </button>

            <div style={S.divider}><span>Belum ada akaun?</span></div>
            <Link href="/signup" style={S.signupLink}>Daftar Sekarang</Link>
          </>
        )}

        {/* FORGOT MODE */}
        {mode === 'forgot' && !forgotResult && (
          <>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 14px', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🔑</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1E40AF', marginBottom: 4 }}>Cari Kata Laluan</div>
              <div style={{ fontSize: 12, color: '#3B82F6' }}>Masukkan nombor telefon ibu/bapa untuk dapatkan ID murid</div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Nombor Telefon Ibu/Bapa</label>
              <input style={S.input} placeholder="cth: 0123456789" value={parentPhone}
                onChange={e => setParentPhone(e.target.value)} type="tel" inputMode="tel"
                onKeyDown={e => e.key === 'Enter' && handleForgot()} />
            </div>
            {error && <div style={S.err}>{error}</div>}
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleForgot} disabled={loading}>
              {loading ? 'Mencari...' : 'Cari Akaun →'}
            </button>
            <button onClick={() => { setMode('login'); setError('') }}
              style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 13, cursor: 'pointer', marginTop: 12, width: '100%', textAlign: 'center' }}>
              ← Kembali ke Log Masuk
            </button>
          </>
        )}

        {/* FORGOT — PILIH ANAK (bila lebih dari 1) */}
        {mode === 'forgot' && !forgotResult && forgotResults.length > 1 && (
          <>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 14px', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>👨‍👩‍👧‍👦</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1E40AF', marginBottom: 4 }}>Nombor ini mempunyai {forgotResults.length} akaun anak</div>
              <div style={{ fontSize: 12, color: '#3B82F6' }}>Pilih nama anak untuk lihat ID murid</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {forgotResults.map((r, i) => (
                <button key={i} onClick={() => setForgotResult(r)} style={{
                  padding: '14px 16px', borderRadius: 12, border: '2px solid #BFDBFE',
                  background: 'white', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s'
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                    {r.full_name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{r.full_name}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      ID: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4F46E5' }}>{r.student_id || '(belum ditetapkan)'}</span>
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#94A3B8', fontSize: 18 }}>›</div>
                </button>
              ))}
            </div>
            <button onClick={() => { setForgotResults([]); setParentPhone('') }}
              style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'center' }}>
              ← Masukkan nombor lain
            </button>
          </>
        )}

        {/* FORGOT RESULT */}
        {mode === 'forgot' && forgotResult && (
          <>
            <div style={{ background: '#F0FDF4', border: '2px solid #86EFAC', borderRadius: 16, padding: '20px', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#14532D', marginBottom: 16 }}>Akaun Dijumpai!</div>
              <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6, fontSize: 13 }}>{forgotResult.full_name}</div>
              <div style={{ background: 'white', borderRadius: 10, padding: '12px 16px', marginBottom: 8, border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID Murid</div>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: '#4F46E5', letterSpacing: 2 }}>{forgotResult.student_id}</div>
              </div>
              <div style={{ background: 'white', borderRadius: 10, padding: '12px 16px', border: '1px solid #BBF7D0', fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                🔒 Untuk keselamatan, kata laluan tidak dipaparkan. Jika terlupa, minta admin tetapkan kata laluan baru.
                {adminWa && (
                  <a href={`https://wa.me/${adminWa}?text=${encodeURIComponent(`Salam, saya ibu/bapa ${forgotResult.full_name} (ID: ${forgotResult.student_id}). Mohon reset kata laluan AEdu.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', marginTop: 10, padding: '10px', background: '#DCFCE7', color: '#15803D', borderRadius: 10, fontWeight: 700, textDecoration: 'none', border: '1px solid #86EFAC' }}>
                    💬 Minta reset melalui WhatsApp
                  </a>
                )}
              </div>
            </div>
            <button style={S.btn} onClick={() => { setMode('login'); setStudentId(forgotResult.student_id); setError('') }}>
              Log Masuk Sekarang →
            </button>
            <button onClick={() => { setForgotResult(null); setForgotResults([]); setParentPhone('') }}
              style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 13, cursor: 'pointer', marginTop: 10, width: '100%', textAlign: 'center' }}>
              ← Cari Akaun Lain
            </button>
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #F1F5F9', textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>
          Disediakan oleh <strong style={{ color: '#64748B' }}>Cikgu Amin</strong> (A-Edu.my) @2026
        </div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)', padding: 16 },
  card: { background: 'white', borderRadius: 24, padding: '36px 28px', width: '100%', maxWidth: 390, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  title: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 900, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 3, marginTop: 10 },
  sub: { color: '#64748B', fontSize: 13, marginBottom: 4 },
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '13px 15px', border: '2px solid #E2E8F0', borderRadius: 12, fontSize: 15, fontWeight: 500, outline: 'none', fontFamily: "'Inter',sans-serif", transition: 'border 0.2s, box-shadow 0.2s', background: '#F8FAFC' },
  err: { background: '#FEF2F2', color: '#EF4444', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14, lineHeight: 1.5 },
  btn: { display: 'block', width: '100%', padding: 14, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", textDecoration: 'none', textAlign: 'center', boxShadow: '0 6px 20px rgba(79,70,229,0.3)' },
  divider: { margin: '18px 0 12px', fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  signupLink: { display: 'block', padding: '12px', background: '#F1F5F9', color: '#4F46E5', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', border: '1px solid #E2E8F0', textAlign: 'center' },
}
